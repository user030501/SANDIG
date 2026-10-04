$installDir = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $env:LOCALAPPDATA "SANDIG"
$processPath = Join-Path $dataDir "processes.json"

if (-not (Test-Path $processPath)) {
    exit 0
}

$managedProcesses = ConvertFrom-Json -InputObject (Get-Content $processPath -Raw)
$installPrefix = [IO.Path]::GetFullPath($installDir).TrimEnd('\') + '\'
foreach ($managed in $managedProcesses) {
    $processId = 0
    if (-not [int]::TryParse([string]$managed.ProcessId, [ref]$processId)) {
        continue
    }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if (-not $process -or -not $process.ExecutablePath) {
        continue
    }
    $expectedExecutable = [IO.Path]::GetFullPath([string]$managed.Executable)
    if (
        $expectedExecutable.StartsWith($installPrefix, [StringComparison]::OrdinalIgnoreCase) -and
        [string]::Equals($expectedExecutable, $process.ExecutablePath, [StringComparison]::OrdinalIgnoreCase)
    ) {
        & taskkill.exe /PID $processId /T /F | Out-Null
    }
}

Remove-Item $processPath -Force -ErrorAction SilentlyContinue