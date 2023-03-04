/**
 * @param {() => void} fn
 */
export function setImmediate(fn) {
  setTimeout(fn, 0);
}
