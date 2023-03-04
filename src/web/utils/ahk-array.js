/**
 * @template T
 * @param {AHKArray<T>} array
 * @returns {T[]}
 */
export function ahkArrayToJSArray(array) {
  const result = [];
  for (let i = 1; i <= array.Length(); i++) {
    const element = array[i];
    result.push(element);
  }
  return result;
}
