$ErrorActionPreference = "Stop"
$installDir = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $env:LOCALAPPDATA "SANDIG"
$databaseDir = Join-Path $dataDir "database"
$logDir = Join-Path $dataDir "logs"
$configPath = Join-Path $dataDir "config.json"
$seedMarker = Join-Path $dataDir "demo-seed-complete"
$processPath = Join-Path $dataDir "processes.json"
$node = Join-Path $installDir "runtime\node.exe"
$mariaDb = Join-Path $installDir "mariadb\bin"
$aiService = Join-Path $installDir "ai\SANDIG-AI.exe"
$mysqlClient = Join-Path $mariaDb "mariadb.exe"
$mariaDbServer = Join-Path $mariaDb "mariadbd.exe"
$databaseInitializer = Join-Path $mariaDb "mariadb-install-db.exe"

function Save-Json {
    param($Value, [string]$Path)

    $temporaryPath = "$Path.tmp"
    ConvertTo-Json -InputObject @($Value) -Depth 5 | Set-Content -Path $temporaryPath -Encoding UTF8
    Move-Item -Path $temporaryPath -Destination $Path -Force
}

function Test-PortAvailable {
    param([int]$Port)

    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    try {
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        $listener.Stop()
    }
}

function Test-PortListening {
    param([int]$Port)

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $client.Connect([System.Net.IPAddress]::Loopback, $Port)
        return $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Find-FreePort {
    param([int]$StartPort)

    for ($port = $StartPort; $port -lt ($StartPort + 300); $port++) {
        if (Test-PortAvailable $port) {
            return $port
        }
    }
    throw "No available localhost port found starting at $StartPort."
}

function Test-HttpReady {
    param([string]$Url)

    try {
        $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return $true
    } catch {
        return $false
    }
}

function Wait-HttpReady {
    param([string]$Url, [int]$Seconds)

    for ($attempt = 0; $attempt -lt ($Seconds * 2); $attempt++) {
        if (Test-HttpReady $Url) {
            return
        }
        Start-Sleep -Milliseconds 500
    }
    throw "Service did not become ready at $Url. See logs in $logDir."
}

function Invoke-MySql {
    param([string]$Query)

    & $mysqlClient "--host=127.0.0.1" "--port=$($config.DatabasePort)" "--user=root" "--password=$($config.DatabaseRootPassword)" "--batch" "--skip-column-names" "--execute=$Query" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "MariaDB command failed. See $logDir\mariadb.err.log."
    }
}

function Register-Process {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Executable
    )

    $script:managedProcesses += @{
        ProcessId = $Process.Id
        Executable = $Executable
    }
    Save-Json $script:managedProcesses $processPath
}

function Start-ManagedProcess {
    param(
        [string]$Executable,
        [string]$Arguments,
        [string]$WorkingDirectory,
        [string]$LogName
    )

    $startParameters = @{
        FilePath = $Executable
        WorkingDirectory = $WorkingDirectory
        WindowStyle = "Hidden"
        RedirectStandardOutput = Join-Path $logDir "$LogName.out.log"
        RedirectStandardError = Join-Path $logDir "$LogName.err.log"
        PassThru = $true
    }
    if (-not [string]::IsNullOrWhiteSpace($Arguments)) {
        $startParameters.ArgumentList = $Arguments
    }
    $process = Start-Process @startParameters
    Register-Process $process $Executable
    return $process
}

try {
    New-Item -ItemType Directory -Path $dataDir, $databaseDir, $logDir -Force | Out-Null
    $apiUrl = $null
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $apiUrl = "http://127.0.0.1:$($config.ServerPort)/api/health"
        if (Test-HttpReady $apiUrl) {
            Start-Process "http://127.0.0.1:$($config.ServerPort)"
            exit 0
        }
        $stopScript = Join-Path $PSScriptRoot "Stop-SANDIG.ps1"
        if (Test-Path $processPath) {
            & $stopScript
        }
    } else {
        if (Test-Path $processPath) {
            $stopScript = Join-Path $PSScriptRoot "Stop-SANDIG.ps1"
            & $stopScript
        }
        $config = [pscustomobject]@{
            DatabasePort = Find-FreePort 34000
            ServerPort = Find-FreePort 31000
            AiPort = Find-FreePort 32000
            DatabaseRootPassword = [Guid]::NewGuid().ToString("N")
            DatabasePassword = [Guid]::NewGuid().ToString("N")
            JwtSecret = [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")
        }
        Save-Json $config $configPath
    }

    foreach ($port in @($config.DatabasePort, $config.ServerPort, $config.AiPort)) {
        if (-not (Test-PortAvailable ([int]$port))) {
            throw "Saved SANDIG port $port is already in use. Stop the process using it and retry."
        }
    }

    $script:managedProcesses = @()

    $dataRootExists = Test-Path (Join-Path $databaseDir "mysql")
    if (-not $dataRootExists) {
        if (-not (Test-Path $databaseInitializer)) {
            throw "MariaDB initializer is missing: $databaseInitializer"
        }
        & $databaseInitializer "--datadir=$databaseDir" "--password=$($config.DatabaseRootPassword)" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "MariaDB data-directory initialization failed. See $logDir."
        }
    }

    $myIni = Join-Path $dataDir "my.ini"
    @(
        "[mysqld]"
        "basedir = `"$($installDir.Replace('\', '/'))/mariadb`""
        "datadir = `"$($databaseDir.Replace('\', '/'))`""
        "bind-address = 127.0.0.1"
        "port = $($config.DatabasePort)"
    ) | Set-Content -Path $myIni -Encoding ASCII

    $null = Start-ManagedProcess $mariaDbServer "--defaults-file=`"$myIni`"" $dataDir "mariadb"
    $databaseReady = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if (Test-PortListening ([int]$config.DatabasePort)) {
            $databaseReady = $true
            break
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $databaseReady) {
        throw "MariaDB did not start. See $logDir\mariadb.err.log."
    }

    $safePassword = $config.DatabasePassword
    Invoke-MySql "CREATE DATABASE IF NOT EXISTS sandig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'sandig_app'@'127.0.0.1' IDENTIFIED BY '$safePassword'; ALTER USER 'sandig_app'@'127.0.0.1' IDENTIFIED BY '$safePassword'; GRANT ALL PRIVILEGES ON sandig.* TO 'sandig_app'@'127.0.0.1';"

    $env:DATABASE_URL = "mysql://sandig_app:$safePassword@127.0.0.1:$($config.DatabasePort)/sandig"
    $env:JWT_SECRET = $config.JwtSecret
    $env:AI_SERVICE_URL = "http://127.0.0.1:$($config.AiPort)"
    $env:SANDIG_AI_PORT = [string]$config.AiPort
    $env:NODE_ENV = "production"
    $env:PORT = [string]$config.ServerPort
    $env:FRONTEND_DIST_DIR = Join-Path $installDir "frontend"

    $null = Start-ManagedProcess $aiService "" $dataDir "ai"
    Wait-HttpReady "$($env:AI_SERVICE_URL)/health" 60

    $prismaCli = Join-Path $installDir "server\node_modules\prisma\build\index.js"
    $schemaPath = Join-Path $installDir "server\prisma\schema.prisma"
    & $node $prismaCli "db" "push" "--schema=$schemaPath"
    if ($LASTEXITCODE -ne 0) {
        throw "Database schema setup failed. See $logDir."
    }

    if (-not (Test-Path $seedMarker)) {
        $tsxCli = Join-Path $installDir "server\node_modules\tsx\dist\cli.mjs"
        $seedScript = Join-Path $installDir "server\prisma\seed.ts"
        & $node $tsxCli $seedScript
        if ($LASTEXITCODE -ne 0) {
            throw "Initial demo-data seed failed. It will be retried on the next start. See $logDir."
        }
        Set-Content -Path $seedMarker -Value "complete" -Encoding ASCII
    }

    $backendEntry = Join-Path $installDir "server\dist\index.js"
    $null = Start-ManagedProcess $node "`"$backendEntry`"" $dataDir "server"
    $apiUrl = "http://127.0.0.1:$($config.ServerPort)/api/health"
    Wait-HttpReady $apiUrl 45
    Start-Process "http://127.0.0.1:$($config.ServerPort)"
} catch {
    Write-Host "SANDIG could not start: $_" -ForegroundColor Red
    Write-Host "Logs: $logDir"
    Read-Host "Press Enter to close"
    exit 1
}