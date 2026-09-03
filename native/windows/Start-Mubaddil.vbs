Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("Wscript.Shell")
nativeDir = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
sh.CurrentDirectory = nativeDir
pythonw = nativeDir & "\.venv\Scripts\pythonw.exe"
If fso.FileExists(pythonw) Then
  sh.Run """" & pythonw & """ -m mubaddil", 0, False
Else
  sh.Run """" & nativeDir & "\windows\Start-Mubaddil.bat""", 1, False
End If

