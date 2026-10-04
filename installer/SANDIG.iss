#ifndef StageDir
  #define StageDir "build\stage"
#endif

[Setup]
AppId={{D7710C4B-4B7B-4D01-9588-12E0D5AA2026}
AppName=SANDIG
AppVersion=1.0.0
AppPublisher=Barangay New Pandan
DefaultDirName={autopf}\SANDIG
DefaultGroupName=SANDIG
UninstallDisplayIcon={app}\frontend\index.html
OutputBaseFilename=SANDIG-Setup-1.0.0
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
DisableProgramGroupPage=yes
CloseApplications=yes
RestartApplications=no
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{commondesktop}\SANDIG"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\Start-SANDIG.ps1"""; WorkingDir: "{app}"
Name: "{group}\Start SANDIG"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\Start-SANDIG.ps1"""; WorkingDir: "{app}"
Name: "{group}\Stop SANDIG"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\Stop-SANDIG.ps1"""; WorkingDir: "{app}"

[Run]
Filename: "{app}\prereqs\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installing Microsoft Visual C++ runtime..."; Flags: runhidden waituntilterminated; Check: VCRedistNeedsInstall

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\Stop-SANDIG.ps1"""; Flags: runhidden waituntilterminated; RunOnceId: "StopSANDIG"

[Code]
function VCRedistNeedsInstall: Boolean;
var
  Installed: Cardinal;
begin
  Result := not RegQueryDWordValue(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed) or (Installed <> 1);
end;