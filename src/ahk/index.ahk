#NoEnv ; Recommended for performance and compatibility with future AutoHotkey releases.
#SingleInstance force
ListLines Off
SetBatchLines -1
SendMode Input ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir% ; Ensures a consistent starting directory.
#KeyHistory 0
#WinActivateForce
#Persistent
CoordMode, Mouse, Screen

Process, Priority,, H

SetWinDelay -1
SetControlDelay -1

; ask for administrator privileges when running as an exe,
; otherwise the keyboard shortcuts may fail to open the task view
; under certain circunstances
If A_IsCompiled
{
    #Include .\make-admin.ahk
}

#Include .\config.ahk
#Include .\gui.ahk
#Include .\vdesktop.ahk
#Include .\thumbnail.ahk

AppData.init(CONFIG.APPDATA_DIR)

VDesktop.init(CONFIG.DESKTOP_DATA_FILE, CONFIG.MONITOR_NUMBER)

webServices := [["GUI", GUI], ["VDesktop", VDesktop], ["Thumbnail", Thumbnail]]
GUI.init(CONFIG.WEB_ROOT, CONFIG.MONITOR_NUMBER, webServices)

Return

CapsLock::
    GUI.toggle()
Return

; unreachable code. For script compilation. Embeds
; index.html and main.js inside the `better-task-view.exe` executable
if (false)
{
    FileInstall, index.html, *
    FileInstall, main.js, *
}