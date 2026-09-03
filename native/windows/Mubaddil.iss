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

[Messages]
WelcomeLabel2=This installs مبدّل on this PC. It fixes typing in the wrong Arabic/English keyboard layout.%n%nNo admin password needed — double-click, Next, Finish.

[Files]
Source: "..\dist\Mubaddil\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\مبدّل"; Filename: "{app}\Mubaddil.exe"
Name: "{userstartup}\مبدّل"; Filename: "{app}\Mubaddil.exe"

[Run]
Filename: "{app}\Mubaddil.exe"; Description: "Run مبدّل now"; Flags: nowait postinstall skipifsilent
