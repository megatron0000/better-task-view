import * as jsuites from "../../../../vendor/jsuites/jsuites";
import "../../../../vendor/jsuites/jsuites.css";
import "./context-menu.css";

let instantiated = false;
const menuAnchorElement = document.createElement("div");

// @ts-ignore `Property 'contextmenu' does not exist [...]`
// because we know it exists inside jsuites
const menuObj = jsuites.contextmenu(menuAnchorElement, {
  onclick() {
    menuObj.close();
  },
});

/**
 * ContextMenu is a singleton component. It must be instantiated
 * only once as a direct child of the body of the document.
 *
 * To open the menu, use `openContextMenu`
 */
export function ContextMenu() {
  if (instantiated === true) {
    throw new Error(
      "Tried to create a second ContextMenu instance, but there can be only 1. To open an existing menu, use openContextMenu() instead"
    );
  }
  instantiated = true;

  return menuAnchorElement;
}

/**
 * @typedef {object} ContextMenuItem
 * @property {string=} title
 * @property {string=} tooltip
 * @property {(() => void)=} onclick
 */

/**
 *
 * @param {Event} event
 * @param {ContextMenuItem[]} items
 */
export function openContextMenu(event, items) {
  menuObj.open(event, items);
}

/**
 * The context menu usually closes naturally because
 * of defocus. But this function can be used to
 * forcefully close it.
 */
export function closeContextMenu() {
  menuObj.close();
}
