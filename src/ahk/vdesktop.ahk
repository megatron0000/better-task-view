#Include ..\..\vendor\VD\VD.ahk
#Include .\appdata.ahk

class VDesktop
{
    _appDataKey := ""
    _desktopDataList := ""
    _monitorNumber := ""

    init(appDataKey, monitorNumber)
    {
        this._appDataKey := appDataKey
        this._desktopDataList := AppData.Load(this._appDataKey, [])
        this._sync_desktopDataList()
        this._monitorNumber := monitorNumber
    }

    _sync_desktopDataList()
    {
        IVirtualDesktopList := VD2.GetIVirtualDesktopList()

        ; exclude desktops that no longer exist
        i := 1
        While (i <= this._desktopDataList.Length())
        {
            desktopGuidString := this._desktopDataList[i].guidString
            index := this._findIndexInIVirtualDesktopList(desktopGuidString, IVirtualDesktopList)
            if (index = 0)
            {
                this._desktopDataList.RemoveAt(i)
            }
            else
            {
                i := i + 1
            }
        }

        ; append new desktops to the end of our list
        Loop % IVirtualDesktopList.Length()
        {
            IVirtualDesktop := IVirtualDesktopList[A_Index]
            guidString := VD2.GetGUIDStringFromIVirtualDesktop(IVirtualDesktop)
            index := this._findIndexInDesktopDataList(guidString, this._desktopDataList)
            if (index = 0) ; did not find
            {
                newData := new DesktopData(guidString, "" + A_Index)
                this._desktopDataList.Push(newData)
            }
        }

        AppData.Save(this._appDataKey, this._desktopDataList)
    }

    _findIndexInIVirtualDesktopList(guidString, IVirtualDesktopList)
    {
        Loop % IVirtualDesktopList.Length()
        {
            IVirtualDesktop := IVirtualDesktopList[A_Index]
            guid := VD2.GetGUIDStringFromIVirtualDesktop(IVirtualDesktop)
            if (guid == guidString)
            {
                return A_Index
            }
        }
        return 0
    }

    _findIndexInDesktopDataList(guidString, desktopDataList)
    {
        Loop % desktopDataList.Length()
        {
            desktopDataObj := desktopDataList[A_Index]
            if (desktopDataObj.guidString == guidString)
            {
                return A_Index
            }
        }
        return 0
    }

    GetCurrentDesktopGuidString()
    {
        Return VD2.GetCurrentDesktopGuidString()
    }

    ListDesktopData()
    {
        Return this._desktopDataList
    }

    SetDesktopName(desktopGuidString, newName)
    {
        index := this._findIndexInDesktopDataList(desktopGuidString, this._desktopDataList)
        if (index = 0) ; did not find
        {
            return
        }

        this._desktopDataList[index].name := newName
        AppData.Save(this._appDataKey, this._desktopDataList)
    }

    NavigateToDesktop(desktopNumber)
    {
        VD2.goToDesktopNum(desktopNumber)
    }

    ActivateWindow(windowHdl)
    {
        VD2.goToDesktopOfWindow("ahk_id " windowHdl, activate:=true)
    }

    CloseWindow(windowHdl)
    {
        windowId := "ahk_id " windowHdl
        VD2.MoveWindowToCurrentDesktop(windowId, False) ; activateWindow:=False
        WinClose, %windowId%
    }

    ; windowHandleList is a JS array
    MoveWindowsToDesktop(windowHandleList, desktopGuidString)
    {
        IVirtualDesktop := VD2.GetIVirtualDesktopFromGuidString(desktopGuidString)

        i := 0
        While i < windowHandleList.length
        {
            windowHdl := windowHandleList[i]
            VD2.MoveWindowToIVirtualDesktop("ahk_id " windowHdl, IVirtualDesktop)
            ; VD2.sendToDesktop(window_ahk_idId, targetDesktopNumber, followYourWindow:=False, activate:=False)
            i := i + 1
        }

    }

    ListWindows(desktopGuidString)
    {
        windowList := []

        DetectHiddenWindows, on
        WinGet windows, List

        Loop %windows%
        {
            windowHdl := windows%A_Index%
            If (VD2._isValidWindow(windowHdl) == False)
            {
                continue
            }

            if (VD2.DesktopGuidStringOfWindow(windowHdl) != desktopGuidString)
            {
                continue
            }

            WinGetTitle, windowTitle, % "ahk_id " windowHdl

            ; skip our own GUI window
            If (windowTitle == A_ScriptName)
            {
                continue
            }

            ; get window state and dimensions.
            ; 44 == size of WINDOWPLACEMENT struct,
            ; see https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-windowplacement
            ; (last struct member does not actually exist)
            VarSetCapacity(windowPlacement, 44, 0)
            NumPut(44, windowPlacement)
            DllCall("GetWindowPlacement", "UPtr", windowHdl, "UPtr", &windowPlacement)
            x := NumGet(windowPlacement, 28, "int")
            y := NumGet(windowPlacement, 32, "int")
            ; FIXME if window is minimized, WINDOWPLACEMENT width and height
            ; cannot be trusted (they refer to how the window would look if it
            ; were restored in non-maximized size, but the thumbnail
            ; size is according to the actual restored state - maximized or not).
            ; I didn't manage to find out how the window will be when it is restored
            ; (i.e. will it be maximized or not ?)
            width := NumGet(windowPlacement, 36, "int") - x
            height := NumGet(windowPlacement, 40, "int") - y
            showStateNum := NumGet(windowPlacement, 8, "UInt")
            ; https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow
            switch showStateNum
            {
            case 1: showState := "normal"
            case 2: showState := "minimized"
            case 3: showState := "maximized"
            ; FIXME check whether values other than 1,2,3 are possible at all (Windows API)
            default: showState := "unknown"
            }

            windowList.Push({title: windowTitle, handle: windowHdl, index: A_Index - 1, showState: showState, width: width, height: height})
        }

        DetectHiddenWindows, off

        return windowList

    }

    MonitorWorkArea()
    {
        SysGet, monitorCoords, MonitorWorkArea, % this._monitorNumber
        return {width: monitorCoordsRight - monitorCoordsLeft, height: monitorCoordsBottom - monitorCoordsTop}
    }

    GoToDesktop(guidString)
    {
        IVirtualDesktop := VD2.GetIVirtualDesktopFromGuidString(guidString)
        VD2.GoToIVirtualDesktop(IVirtualDesktop)
    }

    CreateDesktop()
    {
        VD2.createDesktop()
        this._sync_desktopDataList()
    }

    ; precondition: the desktop to be deleted cannot be the current desktop
    DeleteDesktop(desktopGuidString)
    {
        VD2.DeleteDesktop(desktopGuidString)
        this._sync_desktopDataList()
    }

}

class DesktopData
{
    __New(guidString, name)
    {
        this.guidString := guidString
        this.name := name
    }
}

; VD2 is our extension to the VD class (from vendor/VD)
class VD2 extends VD
{

    ; ===========================================
    ; performance-related overwrites
    ; ===========================================

    ; overwrite
    init()
    {
        ; maps an IVirtualDesktop to its desktop number
        this._IVirtualDesktop2DesktopNum := {}
        base.init()
    }

    ; overwrite
    _desktopNum_from_IVirtualDesktop(IVirtualDesktop)
    {
        if (this._IVirtualDesktop2DesktopNum.HasKey(IVirtualDesktop)) {
            return this._IVirtualDesktop2DesktopNum[(IVirtualDesktop)]
        }

        return base._desktopNum_from_IVirtualDesktop(IVirtualDesktop)
    }

    ; overwrite
    _GetDesktops_Obj()
    {
        Desktops_Obj := base._GetDesktops_Obj()

        ; recalculate the mapping
        this._IVirtualDesktop2DesktopNum := {}
        Loop % Desktops_Obj.GetCount()
        {
            IVirtualDesktop_ofDesktop:=Desktops_Obj.GetAt(A_Index)
            this._IVirtualDesktop2DesktopNum[(IVirtualDesktop_ofDesktop)] := A_Index
        }

        return Desktops_Obj
    }

    ; ===========================================
    ; GUID conversion methods
    ; ===========================================

    ; This code was commented out in the original VD class
    _string_from_GUID(Byref byref_GUID)
    {
        VarSetCapacity(strGUID, 38 * 2) ;38 is StrLen("{FF72FFDD-BE7E-43FC-9C03-AD81681E88E4}")
        DllCall("Ole32.dll\StringFromGUID2", "UPtr", &byref_GUID, "UPtr", &strGUID, "Int", 38 + 1)

        return StrGet(&strGUID, "UTF-16")
    }

    ; new method
    _GUID_from_string(str)
    {
        VarSetCapacity(guid, 16)
        HRESULT := DllCall("Ole32.dll\CLSIDFromString", "Ptr", &str, "Ptr", &guid)
        if (HRESULT != 0)
        {
            MsgBox, Error
        }

        return guid
    }

    ; ===========================================
    ; GUID-querying methods
    ; ===========================================

    ; This code was meant for win10 in the original VD class (it was commented out)
    _dll_GetId(IVirtualDesktop)
    {
        GetId := this._vtable(IVirtualDesktop, 4)
        VarSetCapacity(GUID_Desktop, 16)
        DllCall(GetId, "UPtr",IVirtualDesktop, "Ptr",&GUID_Desktop)
        return GUID_Desktop
    }

    ; new method
    GetGUIDStringFromIVirtualDesktop(IVirtualDesktop)
    {
        guid := this._dll_GetId(IVirtualDesktop)
        return this._string_from_GUID(guid)
    }

    ; new method
    GetCurrentDesktopGuidString()
    {
        IVirtualDesktop := this.GetCurrentIVirtualDesktop()
        return this.GetGUIDStringFromIVirtualDesktop(IVirtualDesktop)
    }

    ; new method
    DesktopGuidStringOfWindow(windowHdl)
    {
        IVirtualDesktop := this._IVirtualDesktop_from_Hwnd(windowHdl)
        return this.GetGUIDStringFromIVirtualDesktop(IVirtualDesktop)
    }

    ; new method
    GetIVirtualDesktopFromGuidString(guidString)
    {
        guid := this._GUID_from_string(guidString)
        IVirtualDesktop:=0
        DllCall(this.FindDesktop, "UPtr", this.IVirtualDesktopManagerInternal, "Ptr", &guid, "Ptr*", IVirtualDesktop)
        return IVirtualDesktop
    }

    ; ===========================================
    ; extension methods
    ; ===========================================

    GetCurrentIVirtualDesktop()
    {
        return this._dll_GetCurrentDesktop()
    }

    ; new method
    GetIVirtualDesktopList()
    {
        result := []
        Desktops_Obj := VD2._GetDesktops_Obj()
        Loop % Desktops_Obj.GetCount()
        {
            IVirtualDesktop := Desktops_Obj.GetAt(A_Index)
            result.Push(IVirtualDesktop)
        }
        return result
    }

    ; new method
    GoToIVirtualDesktop(IVirtualDesktop)
    {
        this._SwitchIVirtualDesktop(IVirtualDesktop)
    }

    ; new method
    MoveWindowToIVirtualDesktop(wintitle, IVirtualDesktop)
    {
        found:=this._getFirstValidWindow(wintitle)
        if (!found) {
            return -1 ;for false
        }
        theHwnd:=found[1]
        thePView:=found[2]

        this._MoveView_to_IVirtualDesktop(thePView, IVirtualDesktop)
    }

    ; variation of super class method `removeDesktop`
    ; precondition: The desktop to be deleted cannot be the current desktop
    DeleteDesktop(desktopGuidString)
    {
        IVirtualDesktop := this.GetIVirtualDesktopFromGuidString(desktopGuidString)

        DllCall(this.Ptr_RemoveDesktop, "UPtr", this.IVirtualDesktopManagerInternal, "Ptr", IVirtualDesktop, "Ptr", this.GetCurrentIVirtualDesktop())
    }

}