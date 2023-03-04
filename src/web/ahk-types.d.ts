/**
 * Array passed in from AHK. Index starts at 1
 */
interface AHKArray<T> {
  Length(): number;
  [index: number]: T;
}

/**
 * Must be manually kept in sync with src/ahk/vdesktop.ahk
 */
declare namespace VDesktop {
  interface WindowInformation {
    title: string;
    handle: number;
    index: number;
    showState: "minimized" | "maximized" | "normal" | "unknown";
    width: number;
    height: number;
  }

  interface DesktopInformation {
    guidString: string;
    name: string;
  }

  function ListWindows(desktopGuidString: string): AHKArray<WindowInformation>;

  function ListDesktopData(): AHKArray<DesktopInformation>;

  function GetCurrentDesktopGuidString(): string;

  function MonitorWorkArea(): {
    width: number;
    height: number;
  };

  function ActivateWindow(windowHdl: number): void;

  function CloseWindow(windowHdl: number): void;

  function GoToDesktop(guidString: string): void;

  function SetDesktopName(desktopGuidString: string, newName: string): void;

  function MoveWindowsToDesktop(
    windowHandleList: number[],
    desktopGuidString: string
  ): void;

  function CreateDesktop(): void;

  /**
   * precondition: the desktop to be deleted cannot be the current desktop
   */
  function DeleteDesktop(desktopGuidString: string): void;
}

/**
 * Must be manually kept in sync with src/ahk/thumbnail.ahk
 */
declare namespace Thumbnail {
  interface Thumbnail {
    Show(): void;
    Destroy(): void;
  }

  interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  function create(
    sourceWindowHandle: number,
    destinationWindowHandle: number,
    sourcePosition: Rect | null,
    destinationPosition: Rect | null
  ): Thumbnail;
}

/**
 * Must be manually kept in sync with src/ahk/gui.ahk
 */
declare namespace GUI {
  const handle: number;
  function Close(): void;
}
