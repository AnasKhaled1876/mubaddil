#define MyAppName "Mubaddil"
#define MyAppVersion "0.1.0"

[Setup]
AppId={{A3C91E70-4B2F-4E11-9C8A-7D6B2F1E4A90}
AppName=مبدّل
AppVersion={#MyAppVersion}
AppPublisher=Mubaddil
DefaultDirName={localappdata}\Mubaddil
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=Mubaddil-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\Mubaddil.exe
DisableProgramGroupPage=yes
DisableWelcomePage=no
CloseApplications=yes
CloseApplicationsFilter=Mubaddil.exe

[Tasks]
Name: uninstallprevious; Description: "Uninstall previous version / إزالة النسخة السابقة"

[Messages]
WelcomeLabel2=This installs مبدّل on this PC. It fixes typing in the wrong Arabic/English keyboard layout.%n%nNo admin password needed — double-click, Next, Finish.%n%nOn the next page, leave "Uninstall previous version" checked if an older copy is already installed.

[Code]
function UninstallRegistryPath: String;
begin
  Result := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{A3C91E70-4B2F-4E11-9C8A-7D6B2F1E4A90}_is1';
end;

function TryUninstallValue(Root: Integer; var Value: String): Boolean;
begin
  Result := RegQueryStringValue(Root, UninstallRegistryPath, 'QuietUninstallString', Value);
  if not Result then
    Result := RegQueryStringValue(Root, UninstallRegistryPath, 'UninstallString', Value);
end;

function GetUninstallString: String;
var
  Value: String;
  Uninstaller: String;
begin
  Value := '';
  if not TryUninstallValue(HKCU, Value) then
    if not TryUninstallValue(HKLM, Value) then
      if not TryUninstallValue(HKCU64, Value) then
        if not TryUninstallValue(HKLM64, Value) then
          if not TryUninstallValue(HKCU32, Value) then
            TryUninstallValue(HKLM32, Value);
  if Value = '' then
  begin
    Uninstaller := ExpandConstant('{localappdata}\Mubaddil\unins000.exe');
    if FileExists(Uninstaller) then
      Value := '"' + Uninstaller + '"';
  end;
  Result := Value;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  UninstallString: String;
  ResultCode: Integer;
begin
  if (CurStep = ssInstall) and WizardIsTaskSelected('uninstallprevious') then
  begin
    UninstallString := GetUninstallString();
    if UninstallString <> '' then
    begin
      Exec(
        RemoveQuotes(UninstallString),
        '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES',
        '',
        SW_HIDE,
        ewWaitUntilTerminated,
        ResultCode
      );
    end;
  end;
end;

[Files]
Source: "..\dist\Mubaddil\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\مبدّل"; Filename: "{app}\Mubaddil.exe"
Name: "{userstartup}\مبدّل"; Filename: "{app}\Mubaddil.exe"

[Run]
Filename: "{app}\Mubaddil.exe"; Description: "Run مبدّل now"; Flags: nowait postinstall skipifsilent
