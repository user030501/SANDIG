param(
    [string]$InnoCompiler
)

$ErrorActionPreference = "Stop"
$installerDir = $PSScriptRoot
$repoRoot = Split-Path -Parent $installerDir
$vendorDir = Join-Path $installerDir "vendor"
$nodeRuntime = Join-Path $vendorDir "node.exe"
$mariaDbDir = Join-Path $vendorDir "mariadb"
$vcRuntime = Join-Path $vendorDir "vc_redist.x64.exe"
$aiPython = Join-Path $repoRoot "ai-service\.venv\Scripts\python.exe"
$modelPath = Join-Path $repoRoot "ai-service\model.joblib"

function Invoke-Checked {
    param(
        [string]$Executable,
        [string[]]$Arguments
    )

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Executable $($Arguments -join ' ')"
    }
}

$activeDevProcesses = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "node.exe" -and
    $_.CommandLine -like "*$repoRoot*" -and
    ($_.CommandLine -match "vite|tsx.*watch|npm-cli\.js.*run dev")
}
if ($activeDevProcesses) {
    throw "Close SANDIG's Vite/backend development servers before building. They can lock generated Prisma files."
}

if (-not (Test-Path $nodeRuntime)) {
    throw "Missing $nodeRuntime. Place the x64 node.exe from the official Node.js Windows ZIP there."
}
if (-not (Test-Path (Join-Path $mariaDbDir "bin\mariadbd.exe"))) {
    throw "Missing $mariaDbDir. Extract the official x64 MariaDB ZIP there."
}
if (-not (Test-Path (Join-Path $mariaDbDir "bin\mariadb-install-db.exe"))) {
    throw "MariaDB's bin\mariadb-install-db.exe was not found in $mariaDbDir."
}
if (-not (Test-Path $vcRuntime)) {
    throw "Missing $vcRuntime. Place Microsoft's x64 Visual C++ Redistributable installer there."
}
if (-not (Test-Path $aiPython)) {
    throw "Missing $aiPython. Create ai-service/.venv and install ai-service/requirements.txt plus PyInstaller."
}
if (-not (Test-Path $modelPath)) {
    throw "Missing $modelPath. Train the AI model before building the installer."
}

if (-not $InnoCompiler) {
    $compiler = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($compiler) {
        $InnoCompiler = $compiler.Source
    } else {
        $defaultCompiler = Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"
        if (Test-Path $defaultCompiler) {
            $InnoCompiler = $defaultCompiler
        } else {
            throw "Inno Setup 6 is required. Install it or pass -InnoCompiler with the path to ISCC.exe."
        }
    }
}

$buildId = Get-Date -Format "yyyyMMdd-HHmmss"
$buildDir = Join-Path $installerDir "build\$buildId"
$stageDir = Join-Path $buildDir "stage"
$releaseDir = Join-Path $buildDir "release"
$aiDist = Join-Path $buildDir "ai-dist"
$aiWork = Join-Path $buildDir "ai-work"
$aiSpec = Join-Path $buildDir "ai-spec"
New-Item -ItemType Directory -Path $stageDir, $releaseDir, $aiDist, $aiWork, $aiSpec -Force | Out-Null

Push-Location $repoRoot
try {
    Invoke-Checked "npm" @("run", "build")

    Push-Location (Join-Path $repoRoot "server")
    try {
        Invoke-Checked (Join-Path $repoRoot "server\node_modules\.bin\prisma.cmd") @("generate")
        Invoke-Checked "npm" @("run", "build")
    } finally {
        Pop-Location
    }

    Push-Location (Join-Path $repoRoot "ai-service")
    try {
        Invoke-Checked $aiPython @(
            "-m", "PyInstaller", "--noconfirm", "--clean", "--onefile",
            "--name", "SANDIG-AI", "--distpath", $aiDist,
            "--workpath", $aiWork, "--specpath", $aiSpec,
            "--add-data", "$modelPath;.", "launcher.py"
        )
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}

$stageServer = Join-Path $stageDir "server"
$stagePrisma = Join-Path $stageServer "prisma"
New-Item -ItemType Directory -Path `
    (Join-Path $stageDir "frontend"), `
    (Join-Path $stageDir "runtime"), `
    (Join-Path $stageDir "ai"), `
    (Join-Path $stageDir "mariadb"), `
    (Join-Path $stageDir "scripts"), `
    (Join-Path $stageDir "prereqs"),
    $stageServer, $stagePrisma | Out-Null

Copy-Item -Path (Join-Path $repoRoot "dist\*") -Destination (Join-Path $stageDir "frontend") -Recurse -Force
Copy-Item -Path (Join-Path $repoRoot "server\dist") -Destination $stageServer -Recurse -Force
Copy-Item -Path (Join-Path $repoRoot "server\src") -Destination $stageServer -Recurse -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "server\package.json") -Destination $stageServer -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "server\prisma\schema.prisma") -Destination $stagePrisma -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "server\prisma\seed.ts") -Destination $stagePrisma -Force
Copy-Item -Path (Join-Path $repoRoot "server\node_modules") -Destination $stageServer -Recurse -Force
Copy-Item -LiteralPath $nodeRuntime -Destination (Join-Path $stageDir "runtime\node.exe") -Force
Copy-Item -Path (Join-Path $mariaDbDir "*") -Destination (Join-Path $stageDir "mariadb") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $aiDist "SANDIG-AI.exe") -Destination (Join-Path $stageDir "ai\SANDIG-AI.exe") -Force
Copy-Item -LiteralPath $vcRuntime -Destination (Join-Path $stageDir "prereqs\vc_redist.x64.exe") -Force
Copy-Item -LiteralPath (Join-Path $installerDir "Start-SANDIG.ps1") -Destination (Join-Path $stageDir "scripts") -Force
Copy-Item -LiteralPath (Join-Path $installerDir "Stop-SANDIG.ps1") -Destination (Join-Path $stageDir "scripts") -Force

$requiredStageFiles = @(
    "frontend\index.html",
    "runtime\node.exe",
    "mariadb\bin\mariadbd.exe",
    "mariadb\bin\mariadb-install-db.exe",
    "ai\SANDIG-AI.exe",
    "server\dist\index.js",
    "server\package.json",
    "server\prisma\schema.prisma",
    "server\prisma\seed.ts",
    "server\node_modules\prisma\build\index.js",
    "prereqs\vc_redist.x64.exe",
    "scripts\Start-SANDIG.ps1",
    "scripts\Stop-SANDIG.ps1"
)
foreach ($relativePath in $requiredStageFiles) {
    if (-not (Test-Path (Join-Path $stageDir $relativePath))) {
        throw "Required installer payload was not staged: $relativePath"
    }
}

$iss = Join-Path $installerDir "SANDIG.iss"
Invoke-Checked $InnoCompiler @("/DStageDir=$stageDir", "/O$releaseDir", $iss)

Write-Host "Installer created in $releaseDir"