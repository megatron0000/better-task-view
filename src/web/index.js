import {
  closeContextMenu,
  ContextMenu,
  openContextMenu,
} from "./components/context-menu/context-menu";
import { DesktopList } from "./components/desktop-list/desktop-list";
import { WindowList } from "./components/window-list/window-list";

import "./index.css";
import { ahkArrayToJSArray } from "./utils/ahk-array";

window.addEventListener("ahk:load", () => {
  const desktopList = DesktopList({
    onHover(desktopGuidString) {
      // avoid triggering hover if this desktop is already being viewed
      if (desktopList.getViewingDesktop() === desktopGuidString) {
        return;
      }

      windowList.updateWindows(desktopGuidString);
      desktopList.setViewing(desktopGuidString);
    },

    onClick(desktopGuidString) {
      VDesktop.GoToDesktop(desktopGuidString);
      GUI.Close();
    },

    onContextMenu(desktopGuidString, event) {
      openContextMenu(event, [
        {
          title: "Rename",
          onclick() {
            desktopList.setEditing(desktopGuidString);
          },
          tooltip: "Rename desktop",
        },
        {
          title: "Delete",
          onclick() {
            closeContextMenu();
            if (desktopGuidString === VDesktop.GetCurrentDesktopGuidString()) {
              openContextMenu(event, [
                {
                  title: "Cannot delete current desktop",
                },
              ]);
              return;
            }
            if (
              ahkArrayToJSArray(VDesktop.ListWindows(desktopGuidString))
                .length !== 0
            ) {
              openContextMenu(event, [
                {
                  title: "Cannot delete non-empty desktop",
                },
              ]);
              return;
            }
            VDesktop.DeleteDesktop(desktopGuidString);
            desktopList.updateDesktopButtons();
          },
          tooltip: "Delete desktop",
        },
        {
          title: "Create",
          onclick() {
            VDesktop.CreateDesktop();
            desktopList.updateDesktopButtons();
          },
          tooltip: "Create a new desktop",
        },
      ]);
    },

    onEditEnd(desktopGuidString, newName) {
      newName = newName.trim();
      if (newName !== "") {
        desktopList.setName(desktopGuidString, newName);
        VDesktop.SetDesktopName(desktopGuidString, newName);
      }
    },

    onDrop(desktopGuidString) {
      VDesktop.MoveWindowsToDesktop(draggingWindowHandles, desktopGuidString);
    },
  });

  /**
   * @type {number[]}
   */
  let draggingWindowHandles = [];

  /**
   * @type {"select" | "deselect"}
   */
  let windowSelectionMode = "select";

  /**
   * @type {"down" | "up"}
   */
  let mouseState = "up";

  const windowList = WindowList({
    onDragStart(event, windowHandle) {
      // cancel drag if selecting windows
      if (windowList.getIsSelecting()) {
        event.preventDefault();
        return;
      }

      let selection = windowList.getSelection();

      // if the window rect is not in the selection,
      // reset selection to only this window rect
      if (!selection.includes(windowHandle)) {
        windowList.clearSelection();
        windowList.select(windowHandle);
        selection = [windowHandle];
      }

      draggingWindowHandles = selection;
    },

    onDragEnd(windowHandle) {
      draggingWindowHandles = [];
      windowList.clearSelection();
      windowList.setIsSelecting(false);
    },

    onClick(windowHandle) {
      if (windowList.getIsSelecting()) {
        // handled in onMouseDown
        return;
      }

      VDesktop.ActivateWindow(windowHandle);
      GUI.Close();
    },

    onMiddleClick(windowHandle) {
      VDesktop.CloseWindow(windowHandle);
      // FIXME: wait some time to let the window finish closing,
      // otherwise the refresh will still see the window
      setTimeout(() => {
        windowList.updateWindows(desktopList.getViewingDesktop());
      }, 200);
    },

    onMouseDown(windowHandle) {
      if (!windowList.getIsSelecting()) {
        // handled in onClick
        return;
      }

      if (windowList.getSelection().includes(windowHandle)) {
        windowSelectionMode = "deselect";
      } else {
        windowSelectionMode = "select";
      }

      if (windowSelectionMode === "select") {
        windowList.select(windowHandle);
      } else {
        windowList.deselect(windowHandle);
      }
    },

    onMouseEnter(windowHandle) {
      if (!windowList.getIsSelecting() || mouseState === "up") {
        return;
      }

      if (windowSelectionMode === "select") {
        windowList.select(windowHandle);
      } else {
        windowList.deselect(windowHandle);
      }
    },
  });

  document.body.appendChild(desktopList.element);
  document.body.appendChild(windowList.element);
  document.body.appendChild(ContextMenu());

  windowList.element.addEventListener("click", (event) => {
    if (event.ctrlKey || event.target !== windowList.element) {
      return;
    }
    windowList.clearSelection();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
      windowList.setIsSelecting(true);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
      windowList.setIsSelecting(false);
    }
  });

  document.addEventListener("mouseup", (event) => {
    mouseState = "up";
  });

  document.addEventListener("mousedown", (event) => {
    mouseState = "down";
  });

  document.addEventListener("mousemove", (event) => {
    // for robustness, check Ctrl key whenever mouse moves
    if (!event.ctrlKey) {
      windowList.setIsSelecting(false);
    }
  });

  window.addEventListener("ahk:gui-open", () => {
    const currentDesktopGuidString = VDesktop.GetCurrentDesktopGuidString();
    desktopList.setViewing(currentDesktopGuidString);
    windowList.updateWindows(currentDesktopGuidString);

    // reset state
    draggingWindowHandles = [];
    windowSelectionMode = "select";
    mouseState = "up";
  });

  window.addEventListener("ahk:gui-close", () => {
    windowList.updateWindows(null);
  });
});
