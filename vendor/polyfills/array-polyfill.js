/* 

@src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/
      Retrieved 2014-12-03
Except keys(), values(), entries() - by chuan@yokestudio.com

Creative Commons Attribution-ShareAlike license (CC-BY-SA), v2.5
@license: http://creativecommons.org/licenses/by-sa/2.5/legalcode

*/

/**
 * Polyfills for ES-6 Array functions
 * - Array.from()
 * - Array.of()
 * - Array.prototype.copyWithin()
 * - Array.prototype.fill()
 * - Array.prototype.find()
 * - Array.prototype.findIndex()
 * - Array.prototype.includes()
 * - Array.prototype.keys()
 * - Array.prototype.values()
 * - Array.prototype.entries()
 *
 * Note: Array.prototype[@@iterator]() is not polyfilled as it only makes sense with Symbols,
 *       which is an ES6 feature that cannot be polyfilled correctly and easily.
 *
 * Note: Array.from() does not work with iterables.
 */

if (!Array["from"]) {
  Array["from"] = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === "function" || toStr.call(fn) === "[object Function]";
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) {
        return 0;
      }
      if (number === 0 || !isFinite(number)) {
        return number;
      }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), 9007199254740991);
    };

    // The length property of the from method is 1.
    return function from(arrayLike /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError(
          "Array.from requires an array-like object - not null or undefined"
        );
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== "undefined") {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function"
          );
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] =
            typeof T === "undefined"
              ? mapFn(kValue, k)
              : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  })();
}

if (!Array["of"]) {
  Array["of"] = function () {
    return Array.prototype.slice.call(arguments);
  };
}

if (!Array.prototype["copyWithin"]) {
  Array.prototype["copyWithin"] = function (target, start /*, end*/) {
    // Steps 1-2.
    if (this == null) {
      throw new TypeError("this is null or not defined");
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-8.
    var relativeTarget = target >> 0;

    var to =
      relativeTarget < 0
        ? Math.max(len + relativeTarget, 0)
        : Math.min(relativeTarget, len);

    // Steps 9-11.
    var relativeStart = start >> 0;

    var from =
      relativeStart < 0
        ? Math.max(len + relativeStart, 0)
        : Math.min(relativeStart, len);

    // Steps 12-14.
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0;

    var finalz =
      relativeEnd < 0
        ? Math.max(len + relativeEnd, 0)
        : Math.min(relativeEnd, len);

    // Step 15.
    var count = Math.min(finalz - from, len - to);

    // Steps 16-17.
    var direction = 1;

    if (from < to && to < from + count) {
      direction = -1;
      from += count - 1;
      to += count - 1;
    }

    // Step 18.
    while (count > 0) {
      if (from in O) {
        O[to] = O[from];
      } else {
        delete O[to];
      }

      from += direction;
      to += direction;
      count--;
    }

    // Step 19.
    return O;
  };
}

if (!Array.prototype["fill"]) {
  Array.prototype["fill"] = function (value) {
    // Steps 1-2.
    if (this == null) {
      throw new TypeError("this is null or not defined");
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0;

    // Step 8.
    var k =
      relativeStart < 0
        ? Math.max(len + relativeStart, 0)
        : Math.min(relativeStart, len);

    // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0;

    // Step 11.
    var finalz =
      relativeEnd < 0
        ? Math.max(len + relativeEnd, 0)
        : Math.min(relativeEnd, len);

    // Step 12.
    while (k < finalz) {
      O[k] = value;
      k++;
    }

    // Step 13.
    return O;
  };
}

if (!Array.prototype["find"]) {
  Array.prototype["find"] = function (predicate) {
    if (this == null) {
      throw new TypeError("Array.prototype.find called on null or undefined");
    }
    if (typeof predicate !== "function") {
      throw new TypeError("predicate must be a function");
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
if (!Array.prototype["findIndex"]) {
  Array.prototype["findIndex"] = function (predicate) {
    if (this == null) {
      throw new TypeError("Array.prototype.find called on null or undefined");
    }
    if (typeof predicate !== "function") {
      throw new TypeError("predicate must be a function");
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype["includes"]) {
  Array.prototype["includes"] = function (searchElement /*, fromIndex*/) {
    if (this === undefined || this === null) {
      throw new TypeError("Cannot convert this value to object");
    }
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) k = 0;
    }
    while (k < len) {
      var currentElement = O[k];
      if (
        searchElement === currentElement ||
        (searchElement !== searchElement && currentElement !== currentElement)
      ) {
        return true;
      }
      k++;
    }
    return false;
  };
}

if (!Array.prototype["keys"]) {
  Array.prototype["keys"] = function () {
    var array = this;
    var nextIndex = 0;
    return {
      next: function () {
        return nextIndex < array.length
          ? { value: nextIndex++, done: false }
          : { done: true };
      },
    };
  };
}

if (!Array.prototype["values"]) {
  Array.prototype["values"] = function () {
    var array = this;
    var nextIndex = 0;
    return {
      next: function () {
        return nextIndex < array.length
          ? { value: array[nextIndex++], done: false }
          : { done: true };
      },
    };
  };
}

if (!Array.prototype["entries"]) {
  Array.prototype["entries"] = function () {
    var array = this;
    var nextIndex = 0;
    return {
      next: function () {
        return nextIndex < array.length
          ? { value: [nextIndex, array[nextIndex++]], done: false }
          : { done: true };
      },
    };
  };
}
