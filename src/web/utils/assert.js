/**
 *
 * @param {*} predicate
 * @returns {asserts predicate}
 */
export function assert(predicate) {
  if (!predicate) {
    throw new Error("assertion failed");
  }
}
