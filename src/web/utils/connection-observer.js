/**
 *
 * @param {Element} element
 * @param {() => void} callback Function to invoke when the element is connected to the document
 */
export function onConnected(element, callback) {
  if (element.isConnected) {
    callback();
    return;
  }

  // see https://stackoverflow.com/a/32726412
  const observer = new MutationObserver(function () {
    if (element.isConnected) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

/**
 *
 * @param {Element} element
 * @param {() => void} callback Function to invoke when the element is disconnected from the document
 * @param {boolean} invokeIfAlreadyDisconnected Whether or not to invoke the callback if
 * the element was already disconnected when `onDisconnected` was called
 */
export function onDisconnected(
  element,
  callback,
  invokeIfAlreadyDisconnected = false
) {
  if (!element.isConnected && invokeIfAlreadyDisconnected) {
    callback();
    return;
  }

  // https://stackoverflow.com/a/32726412
  const observer = new MutationObserver(function () {
    if (!element.isConnected) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}
