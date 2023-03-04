import { assert } from "../../utils/assert.js";
import { createElement } from "../../utils/create-element.js";
import { escapeHTML } from "../../utils/escape-html.js";
import { openContextMenu } from "../context-menu/context-menu.js";
import "./desktop-button.css";

/**
 * @typedef {object} DesktopButtonArgs
 * @property {string} name
 * @property {string} desktopGuidString
 * @property {(desktopGuidString: string) => void} onHover
 * @property {(desktopGuidString: string) => void} onClick
 * @property {(desktopGuidString: string, event:Event) => void} onContextMenu
 * @property {(desktopGuidString: string, newName: string) => void} onEditEnd
 * @property {(desktopGuidString: string) => void} onDrop
 */

/**
 *
 * @param {DesktopButtonArgs} param0
 */
export function DesktopButton({
  name,
  desktopGuidString,
  onHover,
  onClick,
  onContextMenu,
  onEditEnd,
  onDrop,
}) {
  const renderNameSpan = () => `
    <span class="desktop-button__name">
      ${escapeHTML(name)}
    </span>
  `;

  const renderNameInput = () => `
    <input type="text" class="desktop-button__input" value="${escapeHTML(
      name
    )}">
  `;

  const element = createElement(`
    <div class="desktop-button">
      ${renderNameSpan()}
    </div>
  `);

  element.addEventListener("mouseenter", () => onHover(desktopGuidString));

  element.addEventListener("click", () => onClick(desktopGuidString));

  element.addEventListener("contextmenu", (event) => {
    event.preventDefault(); // do not open native context menu
    onContextMenu(desktopGuidString, event);
  });

  element.addEventListener("dragover", (event) => {
    // allow drop
    event.preventDefault();
  });

  element.addEventListener("drop", (event) => onDrop(desktopGuidString));

  /**
   * @param {boolean} viewing
   */
  function setViewing(viewing) {
    if (viewing) element.classList.add("viewing");
    else element.classList.remove("viewing");
  }

  function setEditing() {
    // @ts-ignore because renderNameInput produces an <input>
    const nameInput = createElement(renderNameInput());

    // narrow type
    assert(nameInput instanceof HTMLInputElement);

    element.innerHTML = "";
    element.appendChild(nameInput);
    nameInput.focus();
    nameInput.select();

    /**
     * Dynamically resize input to fit the content
     * @this {HTMLInputElement}
     */
    function resizeInput() {
      // FIXME: magic number 2 to fit the content
      this.style.width = this.value.length + 2 + "ch";
    }
    nameInput.addEventListener("input", resizeInput);
    resizeInput.call(nameInput);

    function finishEditing() {
      // narrow type
      assert(nameInput instanceof HTMLInputElement);
      const newName = nameInput.value;
      element.innerHTML = renderNameSpan();
      onEditEnd(desktopGuidString, newName);
    }

    nameInput.addEventListener("click", (event) => {
      // avoid triggering a click on the parent element (desktop button)
      event.stopPropagation();
    });
    nameInput.addEventListener("blur", finishEditing);
    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "Escape") {
        finishEditing();
      }
    });
  }

  /**
   * @param {string} newName
   */
  function setName(newName) {
    name = newName;
    element.innerHTML = renderNameSpan();
  }

  return {
    element,
    setViewing,
    setEditing,
    setName,
    get desktopGuidString() {
      return desktopGuidString;
    },
  };
}
