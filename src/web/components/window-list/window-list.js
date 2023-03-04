import { createElement } from "../../utils/create-element";
import { WindowRect } from "../window-rect/window-rect";
import "./window-list.css";
import { Lock } from "../../utils/lock";
import { ahkArrayToJSArray } from "../../utils/ahk-array";

/**
 * @typedef {object} WindowListArgs
 * @property {(event: Event, windowHandle: number) => void}  onDragStart
 * @property {(windowHandle: number) => void}  onDragEnd
 * @property {(windowHandle: number) => void}  onClick
 * @property {(windowHandle: number) => void}  onMiddleClick
 * @property {(windowHandle: number) => void}  onMouseDown
 * @property {(windowHandle: number) => void}  onMouseEnter
 */

/**
 * @param {WindowListArgs} param0
 */
export function WindowList({
  onDragStart,
  onDragEnd,
  onClick,
  onMiddleClick,
  onMouseDown,
  onMouseEnter,
}) {
  const element = createElement(`
    <div class="window-list">
    
    </div>
  `);

  // loading windows+thumbnails is kind of slow and asynchronous because of
  // how AHK threads work. This lock helps to avoid bugs
  const lock = new Lock();

  /**
   * @type {ReturnType<WindowRect>[]}
   */
  let windowRectList = [];

  /**
   * @param {string | null} desktopGuidString null means to clear windows
   */
  function updateWindows(desktopGuidString) {
    // FIXME: Without the 0-timeout, if this call comes from a mouseenter,
    // the mouseenter is triggered multiple times
    setImmediate(async () => {
      const held = await lock.hold();
      if (!held) return;

      if (desktopGuidString === null) {
        element.innerHTML = "";
        lock.release();
        return;
      }

      const windowList = ahkArrayToJSArray(
        VDesktop.ListWindows(desktopGuidString)
      );
      const numberOfWindows = windowList.length;

      if (numberOfWindows === 0) {
        element.innerHTML = `<h1 class="nowindow">∅</h1>`;
        lock.release();
        return;
      }

      const { width, height } = calculateWindowRectDimensionsToFit(
        element,
        numberOfWindows
      );

      windowRectList = windowList.map((window) =>
        WindowRect({
          title: window.title,
          width,
          height,
          windowHandle: window.handle,
          onDragStart(event) {
            onDragStart(event, window.handle);
          },
          onDragEnd() {
            onDragEnd(window.handle);
          },
          onClick() {
            onClick(window.handle);
          },
          onMiddleClick() {
            onMiddleClick(window.handle);
          },
          onMouseDown() {
            onMouseDown(window.handle);
          },
          onMouseEnter() {
            onMouseEnter(window.handle);
          },
        })
      );

      element.innerHTML = "";
      // first load all rects into the HTML, so they get to their final positions.
      for (const rect of windowRectList) {
        // if the user hovered another desktop, give up on rendering
        // the windows of this desktop
        if (lock.releaseIfContended()) return;

        element.appendChild(rect.element);
      }
      // then show thumbnails.
      for (const rect of windowRectList) {
        // if the user hovered another desktop, give up on rendering
        // the windows of this desktop
        if (lock.releaseIfContended()) return;

        rect.showThumbnail();
      }

      lock.release();
    });
  }

  /**
   * Selects a window (for drag-and-drop)
   * @param {number} windowHandle
   */
  function select(windowHandle) {
    windowRectList.find((x) => x.windowHandle === windowHandle)?.select();
  }

  /**
   *
   * @param {number} windowHandle
   */
  function deselect(windowHandle) {
    windowRectList.find((x) => x.windowHandle === windowHandle)?.deselect();
  }

  function getSelection() {
    return windowRectList
      .filter((x) => x.isSelected())
      .map((x) => x.windowHandle);
  }

  function clearSelection() {
    windowRectList.filter((x) => x.isSelected()).forEach((x) => x.deselect());
  }

  /**
   * true if and only if holding down Ctrl (window selection mode)
   */
  let isSelecting = false;

  /**
   * @param {boolean} _isSelecting
   */
  function setIsSelecting(_isSelecting) {
    isSelecting = _isSelecting;

    if (isSelecting) {
      element.classList.add("selecting");
    } else {
      element.classList.remove("selecting");
    }
  }

  function getIsSelecting() {
    return isSelecting;
  }

  return {
    element,
    updateWindows,
    select,
    deselect,
    getSelection,
    clearSelection,
    setIsSelecting,
    getIsSelecting,
  };
}

/**
 * Calculates the {width, height} thumbnails must have so that
 * all of them fit inside the screen
 *
 * @param {Element} element
 * @param {number} numberOfRects
 */
function calculateWindowRectDimensionsToFit(element, numberOfRects) {
  const { width: containerWidth, height: containerHeight } =
    element.getBoundingClientRect();

  const { width: desktopWidth, height: desktopHeight } =
    VDesktop.MonitorWorkArea();

  // FIXME magic numbers (CSS dimensions from window-rect)
  const borderStroke = 4;
  const titleHeight = 24;

  const numberOfRectsFitHorizontal = (/** @type {number} */ scale) =>
    Math.floor(containerWidth / (2 * borderStroke + desktopWidth * scale));

  const numberOfRectsFitVertical = (/** @type {number} */ scale) =>
    Math.floor(
      containerHeight / (2 * borderStroke + titleHeight + desktopHeight * scale)
    );

  // find the largest scale that still fits all rects inside the screen
  let scale = 1;
  while (
    numberOfRectsFitHorizontal(scale) * numberOfRectsFitVertical(scale) <
    numberOfRects
  ) {
    scale -= 0.01;
  }

  return {
    width: 2 * borderStroke + desktopWidth * scale,
    height: 2 * borderStroke + titleHeight + desktopHeight * scale,
  };
}
