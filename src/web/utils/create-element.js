/**
 * @param {string} htmlString
 */
export function createElement(htmlString) {
  const dummyContainer = document.createElement("div");
  dummyContainer.innerHTML = htmlString;
  const child = dummyContainer.firstElementChild;

  if (child === null) {
    throw new Error("HTML string does not define an element");
  }

  if (!(child instanceof HTMLElement)) {
    throw new Error("HTML string does not define an HTML element");
  }

  return child;
}
