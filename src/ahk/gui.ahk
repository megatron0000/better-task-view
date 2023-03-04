#Include ..\..\vendor\Neutron\Neutron.ahk

class GUI
{
    isShown := False
    neutron := null
    width := 0
    height := 0
    x := 0
    y := 0

    init(webroot, monitorNumber, webServices)
    {
        this.neutron := new NeutronWindow2()

        this.neutron.Load(webroot)
        this.neutron.Gui()

        SysGet, monitorCoords, Monitor, %monitorNumber%

        this.width := monitorCoordsRight - monitorCoordsLeft
        this.height := monitorCoordsBottom - monitorCoordsTop
        this.x := monitorCoordsLeft
        this.y := monitorCoordsTop

        injectAHKScript := "
        ( ;
            window.__injectAHK = function(webServices) {
                for(let i = 1; i <= webServices.Length(); i++) {
                    const serviceName = webServices[i][1]
                    const serviceObject = webServices[i][2]
                    window[serviceName] = serviceObject
                }
            }
        )"

        ; IE 11 does not support "new CustomEvent(...)", see
        ; https://caniuse.com/?search=customevent
        dispatchEventScript := "
        ( ;
            window.__dispatchEvent = function(eventName, detail) {
                const event = document.createEvent('CustomEvent')
                event.initEvent(eventName, true, true)
                event.detail = detail
                window.dispatchEvent(event)
            }
        )"

        this.neutron.wnd.eval(injectAHKScript)
        this.neutron.wnd.__injectAHK(webServices)

        this.neutron.wnd.eval(dispatchEventScript)
        this.neutron.wnd.__dispatchEvent("ahk:load", {})
    }

    Toggle()
    {
        if (this.isShown)
        {
            this.close()
        }
        else
        {
            this.open()
        }
    }

    Close()
    {
        this.isShown := False
        this.neutron.hide()

        this.neutron.wnd.__dispatchEvent("ahk:gui-close", {})
    }

    Open()
    {
        this.isShown := True
        ; FIXME Show() only animates the window opening on the first open
        this.neutron.Show("w" this.width " h" this.height " x" this.x " y" this.y)
        this.neutron.wnd.__dispatchEvent("ahk:gui-open", {})
        this.neutron.wnd.focus()
    }

    handle[]
    {
        Get
        {
            Return this.neutron.hWnd
        }
    }

}

; NeutronWindow2 is our extension to the neutron library (from vendor/Neutron)
class NeutronWindow2 extends NeutronWindow
{
    ; Overwrites the constructor to avoid calling the dll ole32\RevokeDragDrop, because
    ; it disables drag-and-drop in javascript
    __New(html:="", css:="", js:="", title:="Neutron")
    {
        static wb

        ; Create necessary circular references
        this.bound := {}
        this.bound._OnMessage := this._OnMessage.Bind(this)

        ; Bind message handlers
        for i, message in this.LISTENERS
            OnMessage(message, this.bound._OnMessage)

        ; Create and save the GUI
        Gui, New, +hWndhWnd +Resize -DPIScale
        this.hWnd := hWnd

        ; Enable shadow
        VarSetCapacity(margins, 16, 0)
        NumPut(1, &margins, 0, "Int")
        DllCall("Dwmapi\DwmExtendFrameIntoClientArea"
            , "UPtr", hWnd ; HWND hWnd
            , "UPtr", &margins) ; MARGINS *pMarInset

        ; When manually resizing a window, the contents of the window often "lag
        ; behind" the new window boundaries. Until they catch up, Windows will
        ; render the border and default window color to fill that area. On most
        ; windows this will cause no issue, but for borderless windows this can
        ; cause rendering artifacts such as thin borders or unwanted colors to
        ; appear in that area until the rest of the window catches up.
        ;
        ; When creating a dark-themed application, these artifacts can cause
        ; jarringly visible bright areas. This can be mitigated some by changing
        ; the window settings to cause dark/black artifacts, but it's not a
        ; generalizable approach, so if I were to do that here it could cause
        ; issues with light-themed apps.
        ;
        ; Some borderless window libraries, such as rossy's C implementation
        ; (https://github.com/rossy/borderless-window) hide these artifacts by
        ; playing with the window transparency settings which make them go away
        ; but also makes it impossible to show certain colors (in rossy's case,
        ; Fuchsia/FF00FF).
        ;
        ; Luckly, there's an undocumented Windows API function in user32.dll
        ; called SetWindowCompositionAttribute, which allows you to change the
        ; window accenting policies. This tells the DWM compositor how to fill
        ; in areas that aren't covered by controls. By enabling the "blurbehind"
        ; accent policy, Windows will render a blurred version of the screen
        ; contents behind your window in that area, which will not be visually
        ; jarring regardless of the colors of your application or those behind
        ; it.
        ;
        ; Because this API is undocumented (and unavailable in Windows versions
        ; below 10) it's not a one-size-fits-all solution, and could break with
        ; future system updates. Hopefully a better soultion for the problem
        ; this hack addresses can be found for future releases of this library.
        ;
        ; https://withinrafael.com/2018/02/02/adding-acrylic-blur-to-your-windows-10-apps-redstone-4-desktop-apps/
        ; https://github.com/melak47/BorderlessWindow/issues/13#issuecomment-309154142
        ; http://undoc.airesoft.co.uk/user32.dll/SetWindowCompositionAttribute.php
        ; https://gist.github.com/riverar/fd6525579d6bbafc6e48
        ; https://vhanla.codigobit.info/2015/07/enable-windows-10-aero-glass-aka-blur.html

        Gui, Color, 0, 0
        VarSetCapacity(wcad, A_PtrSize+A_PtrSize+4, 0)
        NumPut(this.WCA_ACCENT_POLICY, &wcad, 0, "Int")
        VarSetCapacity(accent, 16, 0)
        ; Use ACCENT_ENABLE_GRADIENT on Windows 11 to fix window dragging issues
        if(this.OS_MINOR_VER >= 22000)
            AccentState:= this.ACCENT_ENABLE_GRADIENT
        else
            AccentState:= this.ACCENT_ENABLE_BLURBEHIND
        NumPut(AccentState, &accent, 0, "Int")
        NumPut(&accent, &wcad, A_PtrSize, "Ptr")
        NumPut(16, &wcad, A_PtrSize+A_PtrSize, "Int")
        DllCall("SetWindowCompositionAttribute", "UPtr", hWnd, "UPtr", &wcad)

        ; Creating an ActiveX control with a valid URL instantiates a
        ; WebBrowser, saving its object to the associated variable. The "about"
        ; URL scheme allows us to start the control on either a blank page, or a
        ; page with some HTML content pre-loaded by passing HTML after the
        ; colon: "about:<!DOCTYPE html><body>...</body>"

        ; Read more about the WebBrowser control here:
        ; http://msdn.microsoft.com/en-us/library/aa752085

        ; For backwards compatibility reasons, the WebBrowser control defaults
        ; to IE7 emulation mode. The standard method of mitigating this is to
        ; include a compatibility meta tag in the HTML, but this requires
        ; tampering to the HTML and does not solve all compatibility issues.
        ; By tweaking the registry before and after creation of the control we
        ; can opt-out of the browser emulation feature altogether with minimal
        ; impact on the rest of the system.

        ; Read more about browser compatibility modes here:
        ; https://docs.microsoft.com/en-us/archive/blogs/patricka/controlling-webbrowser-control-compatibility

        RegRead, fbe, % this.KEY_FBE, % this.EXE_NAME
        RegWrite, REG_DWORD, % this.KEY_FBE, % this.EXE_NAME, 0
        Gui, Add, ActiveX, vwb hWndhWB x0 y0 w800 h600, about:blank
        if (fbe = "")
            RegDelete, % this.KEY_FBE, % this.EXE_NAME
        else
            RegWrite, REG_DWORD, % this.KEY_FBE, % this.EXE_NAME, % fbe

        ; Save the WebBrowser control to reference later
        this.wb := wb
        this.hWB := hWB

        ; Connect the web browser's event stream to a new event handler object
        ComObjConnect(this.wb, new this.WBEvents(this))

        ; Compute the HTML template if necessary
        if !(html ~= "i)^<!DOCTYPE")
            html := Format(this.TEMPLATE, css, title, html, js)

        ; Write the given content to the page
        this.doc.write(html)
        this.doc.Close()

        ; Inject the AHK objects into the JS scope
        this.wnd.neutron := this
        this.wnd.ahk := new this.Dispatch(this)

        ; Wait for the page to finish loading
        while wb.readyState < 4
            Sleep, 50

        ; Subclass the rendered Internet Explorer_Server control to intercept
        ; its events, including WM_NCHITTEST and WM_NCLBUTTONDOWN.
        ; Read more here: https://forum.juce.com/t/_/27937
        ; And in the AutoHotkey documentation for RegisterCallback (Example 2)

        dhw := A_DetectHiddenWindows
        DetectHiddenWindows, On
        ControlGet, hWnd, hWnd,, Internet Explorer_Server1, % "ahk_id" this.hWnd
        this.hIES := hWnd
        ControlGet, hWnd, hWnd,, Shell DocObject View1, % "ahk_id" this.hWnd
        this.hSDOV := hWnd
        DetectHiddenWindows, %dhw%

        this.pWndProc := RegisterCallback(this._WindowProc, "", 4, &this)
        this.pWndProcOld := DllCall("SetWindowLong" (A_PtrSize == 8 ? "Ptr" : "")
            , "Ptr", this.hIES ; HWND     hWnd
            , "Int", -4 ; int      nIndex (GWLP_WNDPROC)
            , "Ptr", this.pWndProc ; LONG_PTR dwNewLong
            , "Ptr") ; LONG_PTR

    }

    ; Overwrites to disable resizing
    _WindowProc(Msg, wParam, lParam)
    {
        Critical
        hWnd := this
        this := Object(A_EventInfo)

        if (Msg == this.WM_NCLBUTTONDOWN)
        {
            ; Hoist nonclient clicks to main window
            return DllCall("SendMessage", "Ptr", this.hWnd, "UInt", Msg, "UPtr", wParam, "Ptr", lParam, "Ptr")
        }

        ; Otherwise (since above didn't return), pass all unhandled events to the original WindowProc.
        Critical, Off
        return DllCall("CallWindowProc"
            , "Ptr", this.pWndProcOld ; WNDPROC lpPrevWndFunc
            , "Ptr", hWnd ; HWND    hWnd
            , "UInt", Msg ; UINT    Msg
            , "UPtr", wParam ; WPARAM  wParam
            , "Ptr", lParam ; LPARAM  lParam
            , "Ptr") ; LRESULT
    }
}