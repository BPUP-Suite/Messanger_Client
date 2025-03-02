; Nome del file: setup.iss
#define MyAppName "Messanger"
#define MyAppVersion "0.0.5"
#define MyAppPublisher "BPUP"
#define MyAppExeName "Messanger.exe"
#define MyAppAssocName MyAppName + " Application"
#define MyAppAssocExt ".exe"
#define MyAppAssocKey StringChange(MyAppAssocName, " ", "") + MyAppAssocExt

[Setup]
AppId={{76878263-5430-4741-bd75-6110c79b90df}} 
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppPublisher}\{#MyAppName} 
DefaultGroupName={#MyAppName}
SetupIconFile=assets\icon.ico 
OutputDir=Output
OutputBaseFilename=MessangerSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\assets\icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; File eseguibile principale e DLL necessarie
Source: "Messanger.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Messanger.exe.config"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.Core.xml"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.WinForms.xml"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.Wpf.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.Wpf.xml"; DestDir: "{app}"; Flags: ignoreversion
; Cartelle assets e runtimes
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "runtimes\*"; DestDir: "{app}\runtimes"; Flags: ignoreversion recursesubdirs createallsubdirs
; Bootstrapper WebView2 (copiato in {tmp} e eliminato dopo l'uso)
Source: "installer\MicrosoftEdgeWebView2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\Messanger"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Messanger"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Esegue il bootstrapper di WebView2 da {tmp}
Filename: "{tmp}\MicrosoftEdgeWebView2Setup.exe"; Parameters: "/silent /install"; \
    StatusMsg: "Installing Microsoft Edge WebView2 Runtime..."; Flags: waituntilterminated

[Code]
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ErrorCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    // Termina il processo Messanger.exe prima della disinstallazione
    Exec('taskkill.exe', '/F /IM Messanger.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    if ErrorCode <> 0 then
    begin
      MsgBox('Errore durante la terminazione del processo Messanger.exe. Codice: ' + IntToStr(ErrorCode), mbError, MB_OK);
    end;
  end;

  if CurUninstallStep = usPostUninstall then
  begin
    // Forza la rimozione dell'intera cartella BPUP dopo la disinstallazione
    if DelTree(ExpandConstant('{userappdata}\BPUP'), True, True, True) then
    begin
      // Opzionale: conferma che la rimozione è avvenuta
      // MsgBox('Cartella BPUP rimossa con successo.', mbInformation, MB_OK);
    end
    else
    begin
      MsgBox('Errore durante la rimozione della cartella BPUP.', mbError, MB_OK);
    end;
  end;
end;