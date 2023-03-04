import { assert } from "../../utils/assert";
import { onDisconnected } from "../../utils/connection-observer";
import { createElement } from "../../utils/create-element";
import { escapeHTML } from "../../utils/escape-html";
import "./window-rect.css";

/**
 * @typedef {object} WindowRectArgs
 * @property {string} title
 * @property  {number} width
 * @property {number} height
 * @property {number} windowHandle
 * @property {(event: Event) => void} onDragStart
 * @property {() => void} onDragEnd
 * @property {() => void} onClick
 * @property {() => void} onMiddleClick
 * @property {() => void} onMouseDown
 * @property {() => void} onMouseEnter
 */

/**
 * @param {WindowRectArgs} param0
 */
export function WindowRect({
  title,
  width,
  height,
  windowHandle,
  onDragStart,
  onDragEnd,
  onClick,
  onMiddleClick,
  onMouseDown,
  onMouseEnter,
}) {
  const element = createElement(`
    <div class="window-rect" style="width: ${width}px; height: ${height}px;" draggable="true">
      <div class="window-rect__title">
          <strong>${escapeHTML(title)}</strong>
      </div>
      <div class="window-rect__thumbnail">
      </div>
    </div>
  `);

  element.addEventListener("click", () => onClick());

  // to detect middle click, "click" event does not work
  element.addEventListener("mouseup", (event) => {
    // filter only middle click
    if (event.which !== 2) {
      return;
    }
    onMiddleClick();
  });

  element.addEventListener("dragstart", (event) => onDragStart(event));

  element.addEventListener("dragend", () => onDragEnd());

  element.addEventListener("mousedown", () => onMouseDown());

  element.addEventListener("mouseenter", () => onMouseEnter());

  function showThumbnail() {
    const thumbnailContainer = element.querySelector(".window-rect__thumbnail");
    // narrow type
    assert(thumbnailContainer);
    const rect = thumbnailContainer.getBoundingClientRect();

    // FIXME: (third argument to Thumbnail.create) I didn't manage to find out how
    // to calculate the size of a minimized window with the Windows API
    // (if it is not minimized, this is easy).
    // For the time being, we ignore the dimensions of the source window and simply
    // assume it is maximized. A downside to this approach is that windows which
    // are not maximized (e.g. half the width of the screen) are distorted in
    // the thumbnail
    const thumbnail = Thumbnail.create(windowHandle, GUI.handle, null, rect);

    onDisconnected(element, () => {
      thumbnail.Destroy();
    });

    thumbnail.Show();
  }

  let selected = false;

  /**
   * Selects the window for drag-and-drop
   */
  function select() {
    selected = true;
    element.classList.add("selected");
  }

  function deselect() {
    selected = false;
    element.classList.remove("selected");
  }

  function isSelected() {
    return selected;
  }

  const component = {
    element,
    showThumbnail,
    select,
    deselect,
    isSelected,
    windowHandle,
  };
  return component;
}
