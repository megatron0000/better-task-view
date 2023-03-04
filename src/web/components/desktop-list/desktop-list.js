import { ahkArrayToJSArray } from "../../utils/ahk-array.js";
import { createElement } from "../../utils/create-element.js";
import { DesktopButton } from "../desktop-button/desktop-button.js";
import "./desktop-list.css";

/**
 * @typedef {object} DesktopListArgs
 * @property {(desktopGuidString: string) => void} onHover
 * @property {(desktopGuidString: string) => void} onClick
 * @property {(desktopGuidString: string, event: Event) => void} onContextMenu
 * @property {(desktopGuidString: string, newName: string) => void} onEditEnd
 * @property {(desktopGuidString: string) => void} onDrop
 */

/**
 *
 * @param {DesktopListArgs} param0
 * @returns
 */
export function DesktopList({
  onHover,
  onClick,
  onContextMenu,
  onEditEnd,
  onDrop,
}) {
  const element = createElement(`
    <div class="desktop-list">
    
    </div>
  `);

  // scroll the desktop buttons based on mouse position
  // if there are more desktops than fits the screen
  window.addEventListener("mousemove", (event) => {
    // if element does not overflow, do nothing
    if (element.scrollWidth <= window.innerWidth) return;

    // scroll the element based on the distance between the mouse
    // and the (horizontal) center of the screen.
    //
    // 0.2 to scale down the amount of scroll
    const mousePercent = 0.2 * (event.clientX / window.innerWidth - 0.5);
    element.style.marginLeft = `${-mousePercent * element.scrollWidth}px`;
  });

  /**
   * @type {ReturnType<DesktopButton>[]}
   */
  let desktopButtons = [];
  updateDesktopButtons();

  function updateDesktopButtons() {
    const desktopInformationArray = ahkArrayToJSArray(
      VDesktop.ListDesktopData()
    );

    const newDesktopButtons = [];

    // calculate new desktop buttons
    for (const desktopInformation of desktopInformationArray) {
      const desktopButton = desktopButtons.find(
        (x) => x.desktopGuidString === desktopInformation.guidString
      );

      // desktop is new: instantiate a new DesktopButton
      if (!desktopButton) {
        newDesktopButtons.push(
          DesktopButton({
            name: desktopInformation.name,
            desktopGuidString: desktopInformation.guidString,
            onHover,
            onClick,
            onContextMenu,
            onEditEnd,
            onDrop,
          })
        );
      }
      // desktop already exists, use current desktop button
      else {
        newDesktopButtons.push(desktopButton);
      }
    }

    // remove from the DOM desktops that were deleted
    for (const desktopButton of desktopButtons) {
      if (!newDesktopButtons.includes(desktopButton)) {
        desktopButton.element.remove();
      }
    }

    newDesktopButtons.forEach((button) => element.appendChild(button.element));
    desktopButtons = newDesktopButtons;
  }

  let viewingDesktop = "";

  /**
   * @param {string} desktopGuidString
   */
  function setViewing(desktopGuidString) {
    if (viewingDesktop !== null) {
      desktopButtons
        .find((x) => x.desktopGuidString === viewingDesktop)
        ?.setViewing(false);
    }

    viewingDesktop = desktopGuidString;
    desktopButtons
      .find((x) => x.desktopGuidString === desktopGuidString)
      ?.setViewing(true);
  }

  function getViewingDesktop() {
    return viewingDesktop;
  }

  /**
   * @param {string} desktopGuidString
   */
  function setEditing(desktopGuidString) {
    desktopButtons
      .find((x) => x.desktopGuidString === desktopGuidString)
      ?.setEditing();
  }

  /**
   * @param {string} desktopGuidString
   * @param {string} newName
   */
  function setName(desktopGuidString, newName) {
    desktopButtons
      .find((x) => x.desktopGuidString === desktopGuidString)
      ?.setName(newName);
  }

  return {
    element,
    updateDesktopButtons,
    setViewing,
    getViewingDesktop,
    setEditing,
    setName,
  };
}
