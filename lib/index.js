(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.SCHEMA = {}));
}(this, function (exports) { 'use strict';

  /* globals window, HTMLElement */

  /**!
   * is
   * the definitive JavaScript type testing library
   *
   * @copyright 2013-2014 Enrico Marino / Jordan Harband
   * @license MIT
   */

  var objProto = Object.prototype;
  var owns = objProto.hasOwnProperty;
  var toStr = objProto.toString;
  var symbolValueOf;
  if (typeof Symbol === 'function') {
    symbolValueOf = Symbol.prototype.valueOf;
  }
  var bigIntValueOf;
  if (typeof BigInt === 'function') {
    bigIntValueOf = BigInt.prototype.valueOf;
  }
  var isActualNaN = function (value) {
    return value !== value;
  };
  var NON_HOST_TYPES = {
    'boolean': 1,
    number: 1,
    string: 1,
    undefined: 1
  };

  var base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
  var hexRegex = /^[A-Fa-f0-9]+$/;

  /**
   * Expose `is`
   */

  var is = {};

  /**
   * Test general.
   */

  /**
   * is.type
   * Test if `value` is a type of `type`.
   *
   * @param {*} value value to test
   * @param {String} type type
   * @return {Boolean} true if `value` is a type of `type`, false otherwise
   * @api public
   */

  is.a = is.type = function (value, type) {
    return typeof value === type;
  };

  /**
   * is.defined
   * Test if `value` is defined.
   *
   * @param {*} value value to test
   * @return {Boolean} true if 'value' is defined, false otherwise
   * @api public
   */

  is.defined = function (value) {
    return typeof value !== 'undefined';
  };

  /**
   * is.empty
   * Test if `value` is empty.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is empty, false otherwise
   * @api public
   */

  is.empty = function (value) {
    var type = toStr.call(value);
    var key;

    if (type === '[object Array]' || type === '[object Arguments]' || type === '[object String]') {
      return value.length === 0;
    }

    if (type === '[object Object]') {
      for (key in value) {
        if (owns.call(value, key)) {
          return false;
        }
      }
      return true;
    }

    return !value;
  };

  /**
   * is.equal
   * Test if `value` is equal to `other`.
   *
   * @param {*} value value to test
   * @param {*} other value to compare with
   * @return {Boolean} true if `value` is equal to `other`, false otherwise
   */

  is.equal = function equal(value, other) {
    if (value === other) {
      return true;
    }

    var type = toStr.call(value);
    var key;

    if (type !== toStr.call(other)) {
      return false;
    }

    if (type === '[object Object]') {
      for (key in value) {
        if (!is.equal(value[key], other[key]) || !(key in other)) {
          return false;
        }
      }
      for (key in other) {
        if (!is.equal(value[key], other[key]) || !(key in value)) {
          return false;
        }
      }
      return true;
    }

    if (type === '[object Array]') {
      key = value.length;
      if (key !== other.length) {
        return false;
      }
      while (key--) {
        if (!is.equal(value[key], other[key])) {
          return false;
        }
      }
      return true;
    }

    if (type === '[object Function]') {
      return value.prototype === other.prototype;
    }

    if (type === '[object Date]') {
      return value.getTime() === other.getTime();
    }

    return false;
  };

  /**
   * is.hosted
   * Test if `value` is hosted by `host`.
   *
   * @param {*} value to test
   * @param {*} host host to test with
   * @return {Boolean} true if `value` is hosted by `host`, false otherwise
   * @api public
   */

  is.hosted = function (value, host) {
    var type = typeof host[value];
    return type === 'object' ? !!host[value] : !NON_HOST_TYPES[type];
  };

  /**
   * is.instance
   * Test if `value` is an instance of `constructor`.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an instance of `constructor`
   * @api public
   */

  is.instance = is['instanceof'] = function (value, constructor) {
    return value instanceof constructor;
  };

  /**
   * is.nil / is.null
   * Test if `value` is null.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is null, false otherwise
   * @api public
   */

  is.nil = is['null'] = function (value) {
    return value === null;
  };

  /**
   * is.undef / is.undefined
   * Test if `value` is undefined.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is undefined, false otherwise
   * @api public
   */

  is.undef = is.undefined = function (value) {
    return typeof value === 'undefined';
  };

  /**
   * Test arguments.
   */

  /**
   * is.args
   * Test if `value` is an arguments object.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an arguments object, false otherwise
   * @api public
   */

  is.args = is.arguments = function (value) {
    var isStandardArguments = toStr.call(value) === '[object Arguments]';
    var isOldArguments = !is.array(value) && is.arraylike(value) && is.object(value) && is.fn(value.callee);
    return isStandardArguments || isOldArguments;
  };

  /**
   * Test array.
   */

  /**
   * is.array
   * Test if 'value' is an array.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an array, false otherwise
   * @api public
   */

  is.array = Array.isArray || function (value) {
    return toStr.call(value) === '[object Array]';
  };

  /**
   * is.arguments.empty
   * Test if `value` is an empty arguments object.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an empty arguments object, false otherwise
   * @api public
   */
  is.args.empty = function (value) {
    return is.args(value) && value.length === 0;
  };

  /**
   * is.array.empty
   * Test if `value` is an empty array.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an empty array, false otherwise
   * @api public
   */
  is.array.empty = function (value) {
    return is.array(value) && value.length === 0;
  };

  /**
   * is.arraylike
   * Test if `value` is an arraylike object.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an arguments object, false otherwise
   * @api public
   */

  is.arraylike = function (value) {
    return !!value && !is.bool(value)
      && owns.call(value, 'length')
      && isFinite(value.length)
      && is.number(value.length)
      && value.length >= 0;
  };

  /**
   * Test boolean.
   */

  /**
   * is.bool
   * Test if `value` is a boolean.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a boolean, false otherwise
   * @api public
   */

  is.bool = is['boolean'] = function (value) {
    return toStr.call(value) === '[object Boolean]';
  };

  /**
   * is.false
   * Test if `value` is false.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is false, false otherwise
   * @api public
   */

  is['false'] = function (value) {
    return is.bool(value) && Boolean(Number(value)) === false;
  };

  /**
   * is.true
   * Test if `value` is true.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is true, false otherwise
   * @api public
   */

  is['true'] = function (value) {
    return is.bool(value) && Boolean(Number(value)) === true;
  };

  /**
   * Test date.
   */

  /**
   * is.date
   * Test if `value` is a date.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a date, false otherwise
   * @api public
   */

  is.date = function (value) {
    return toStr.call(value) === '[object Date]';
  };

  /**
   * is.date.valid
   * Test if `value` is a valid date.
   *
   * @param {*} value value to test
   * @returns {Boolean} true if `value` is a valid date, false otherwise
   */
  is.date.valid = function (value) {
    return is.date(value) && !isNaN(Number(value));
  };

  /**
   * Test element.
   */

  /**
   * is.element
   * Test if `value` is an html element.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an HTML Element, false otherwise
   * @api public
   */

  is.element = function (value) {
    return value !== undefined
      && typeof HTMLElement !== 'undefined'
      && value instanceof HTMLElement
      && value.nodeType === 1;
  };

  /**
   * Test error.
   */

  /**
   * is.error
   * Test if `value` is an error object.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an error object, false otherwise
   * @api public
   */

  is.error = function (value) {
    return toStr.call(value) === '[object Error]';
  };

  /**
   * Test function.
   */

  /**
   * is.fn / is.function (deprecated)
   * Test if `value` is a function.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a function, false otherwise
   * @api public
   */

  is.fn = is['function'] = function (value) {
    var isAlert = typeof window !== 'undefined' && value === window.alert;
    if (isAlert) {
      return true;
    }
    var str = toStr.call(value);
    return str === '[object Function]' || str === '[object GeneratorFunction]' || str === '[object AsyncFunction]';
  };

  /**
   * Test number.
   */

  /**
   * is.number
   * Test if `value` is a number.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a number, false otherwise
   * @api public
   */

  is.number = function (value) {
    return toStr.call(value) === '[object Number]';
  };

  /**
   * is.infinite
   * Test if `value` is positive or negative infinity.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is positive or negative Infinity, false otherwise
   * @api public
   */
  is.infinite = function (value) {
    return value === Infinity || value === -Infinity;
  };

  /**
   * is.decimal
   * Test if `value` is a decimal number.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a decimal number, false otherwise
   * @api public
   */

  is.decimal = function (value) {
    return is.number(value) && !isActualNaN(value) && !is.infinite(value) && value % 1 !== 0;
  };

  /**
   * is.divisibleBy
   * Test if `value` is divisible by `n`.
   *
   * @param {Number} value value to test
   * @param {Number} n dividend
   * @return {Boolean} true if `value` is divisible by `n`, false otherwise
   * @api public
   */

  is.divisibleBy = function (value, n) {
    var isDividendInfinite = is.infinite(value);
    var isDivisorInfinite = is.infinite(n);
    var isNonZeroNumber = is.number(value) && !isActualNaN(value) && is.number(n) && !isActualNaN(n) && n !== 0;
    return isDividendInfinite || isDivisorInfinite || (isNonZeroNumber && value % n === 0);
  };

  /**
   * is.integer
   * Test if `value` is an integer.
   *
   * @param value to test
   * @return {Boolean} true if `value` is an integer, false otherwise
   * @api public
   */

  is.integer = is['int'] = function (value) {
    return is.number(value) && !isActualNaN(value) && value % 1 === 0;
  };

  /**
   * is.maximum
   * Test if `value` is greater than 'others' values.
   *
   * @param {Number} value value to test
   * @param {Array} others values to compare with
   * @return {Boolean} true if `value` is greater than `others` values
   * @api public
   */

  is.maximum = function (value, others) {
    if (isActualNaN(value)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.arraylike(others)) {
      throw new TypeError('second argument must be array-like');
    }
    var len = others.length;

    while (--len >= 0) {
      if (value < others[len]) {
        return false;
      }
    }

    return true;
  };

  /**
   * is.minimum
   * Test if `value` is less than `others` values.
   *
   * @param {Number} value value to test
   * @param {Array} others values to compare with
   * @return {Boolean} true if `value` is less than `others` values
   * @api public
   */

  is.minimum = function (value, others) {
    if (isActualNaN(value)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.arraylike(others)) {
      throw new TypeError('second argument must be array-like');
    }
    var len = others.length;

    while (--len >= 0) {
      if (value > others[len]) {
        return false;
      }
    }

    return true;
  };

  /**
   * is.nan
   * Test if `value` is not a number.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is not a number, false otherwise
   * @api public
   */

  is.nan = function (value) {
    return !is.number(value) || value !== value;
  };

  /**
   * is.even
   * Test if `value` is an even number.
   *
   * @param {Number} value value to test
   * @return {Boolean} true if `value` is an even number, false otherwise
   * @api public
   */

  is.even = function (value) {
    return is.infinite(value) || (is.number(value) && value === value && value % 2 === 0);
  };

  /**
   * is.odd
   * Test if `value` is an odd number.
   *
   * @param {Number} value value to test
   * @return {Boolean} true if `value` is an odd number, false otherwise
   * @api public
   */

  is.odd = function (value) {
    return is.infinite(value) || (is.number(value) && value === value && value % 2 !== 0);
  };

  /**
   * is.ge
   * Test if `value` is greater than or equal to `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean}
   * @api public
   */

  is.ge = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value >= other;
  };

  /**
   * is.gt
   * Test if `value` is greater than `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean}
   * @api public
   */

  is.gt = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value > other;
  };

  /**
   * is.le
   * Test if `value` is less than or equal to `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean} if 'value' is less than or equal to 'other'
   * @api public
   */

  is.le = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value <= other;
  };

  /**
   * is.lt
   * Test if `value` is less than `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean} if `value` is less than `other`
   * @api public
   */

  is.lt = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value < other;
  };

  /**
   * is.within
   * Test if `value` is within `start` and `finish`.
   *
   * @param {Number} value value to test
   * @param {Number} start lower bound
   * @param {Number} finish upper bound
   * @return {Boolean} true if 'value' is is within 'start' and 'finish'
   * @api public
   */
  is.within = function (value, start, finish) {
    if (isActualNaN(value) || isActualNaN(start) || isActualNaN(finish)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.number(value) || !is.number(start) || !is.number(finish)) {
      throw new TypeError('all arguments must be numbers');
    }
    var isAnyInfinite = is.infinite(value) || is.infinite(start) || is.infinite(finish);
    return isAnyInfinite || (value >= start && value <= finish);
  };

  /**
   * Test object.
   */

  /**
   * is.object
   * Test if `value` is an object.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is an object, false otherwise
   * @api public
   */
  is.object = function (value) {
    return toStr.call(value) === '[object Object]';
  };

  /**
   * is.primitive
   * Test if `value` is a primitive.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a primitive, false otherwise
   * @api public
   */
  is.primitive = function isPrimitive(value) {
    if (!value) {
      return true;
    }
    if (typeof value === 'object' || is.object(value) || is.fn(value) || is.array(value)) {
      return false;
    }
    return true;
  };

  /**
   * is.hash
   * Test if `value` is a hash - a plain object literal.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a hash, false otherwise
   * @api public
   */

  is.hash = function (value) {
    return is.object(value) && value.constructor === Object && !value.nodeType && !value.setInterval;
  };

  /**
   * Test regexp.
   */

  /**
   * is.regexp
   * Test if `value` is a regular expression.
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a regexp, false otherwise
   * @api public
   */

  is.regexp = function (value) {
    return toStr.call(value) === '[object RegExp]';
  };

  /**
   * Test string.
   */

  /**
   * is.string
   * Test if `value` is a string.
   *
   * @param {*} value value to test
   * @return {Boolean} true if 'value' is a string, false otherwise
   * @api public
   */

  is.string = function (value) {
    return toStr.call(value) === '[object String]';
  };

  /**
   * Test base64 string.
   */

  /**
   * is.base64
   * Test if `value` is a valid base64 encoded string.
   *
   * @param {*} value value to test
   * @return {Boolean} true if 'value' is a base64 encoded string, false otherwise
   * @api public
   */

  is.base64 = function (value) {
    return is.string(value) && (!value.length || base64Regex.test(value));
  };

  /**
   * Test base64 string.
   */

  /**
   * is.hex
   * Test if `value` is a valid hex encoded string.
   *
   * @param {*} value value to test
   * @return {Boolean} true if 'value' is a hex encoded string, false otherwise
   * @api public
   */

  is.hex = function (value) {
    return is.string(value) && (!value.length || hexRegex.test(value));
  };

  /**
   * is.symbol
   * Test if `value` is an ES6 Symbol
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a Symbol, false otherise
   * @api public
   */

  is.symbol = function (value) {
    return typeof Symbol === 'function' && toStr.call(value) === '[object Symbol]' && typeof symbolValueOf.call(value) === 'symbol';
  };

  /**
   * is.bigint
   * Test if `value` is an ES-proposed BigInt
   *
   * @param {*} value value to test
   * @return {Boolean} true if `value` is a BigInt, false otherise
   * @api public
   */

  is.bigint = function (value) {
    // eslint-disable-next-line valid-typeof
    return typeof BigInt === 'function' && toStr.call(value) === '[object BigInt]' && typeof bigIntValueOf.call(value) === 'bigint';
  };

  var is_1 = is;

  const NotSet = Symbol('NOT SET');
  const isUnset = (a) => (a === NotSet ? true : !a);

  function s(n) {
    if (isUnset(n)) {
      return '';
    }
    if (is_1.string(n)) {
      return n;
    }
    if (is_1.symbol(n)) {
      return n.toString();
    }

    if (Array.isArray(n)) {
      return `[${n.map(s).join(',')}]`;
    }

    try {
      return `${n}`;
    } catch (err) {
      return '--value--';
    }
  }

  function exec(test, value, ...args) {
    const type = typeof (test);
    if (test instanceof Inspector) {
      return test.errors(value, ...args);
    }
    if (type === 'function') {
      return test(value, ...args);
    }
    if (type === 'string') {
      if (!is_1.fn(is_1[test])) {
        throw new Error(`${s(test)} is not a function of is`);
      }
      const out = !is_1[test](value);
      if (out) {
        return `${value} must be a ${test}`;
      }
      return out;
    }
    // @todo: array?
    return NotSet;
  }

  class Inspector {
    constructor(fn = NotSet, ifBad = NotSet, name = NotSet) {
      if (name) {
        this.name = name;
      }
      this._query = [];
      this._union = 'and';
      this.q(fn)
        .ifBad(ifBad);
    }

    ifBad(handler = NotSet) {
      this._ifBad = handler;
      return this;
    }

    each(...args) {
      const testItem = new Inspector(...args);
      const each = (list) => {
        const result = list.reduce((out, item, i) => {
          if (!isUnset(out)) return out;
          return exec(testItem, item, i, list);
        }, NotSet);
        if (isUnset(result)) return false;
        return result;
      };
      return this.and([
        new Inspector('array'),
        each,
      ]);
    }


    eachWithDetail(test, ifError = NotSet) {
      const testIns = new Inspector(test);
      const each = (list) => {
        const result = list.reduce((out, item, i) => {
          if (!isUnset(out)) return out;
          const error = exec(testIns, item, i, list);
          if (error) return [error, item, i, list];
          return false;
        }, NotSet);
        if (isUnset(result)) return false;
        return result;
      };
      return this.and([
        'array',
        new Inspector(each, ifError),
      ]);
    }

    q(fn) {
      if (isUnset(fn)) {
        return this;
      }
      const type = typeof (fn);

      if (type === 'function') {
        this._query.push(fn);
      } else if (type === 'string') {
        if (typeof is_1[fn] !== 'function') {
          throw new Error(`${fn} is not a valid test`);
        }
        this._query.push(fn);
      } else if (fn instanceof Inspector) {
        this._query.push(fn);
      } else if (Array.isArray(fn)) {
        if (!fn.length) return this;
        return this.and(fn);
      } else {
        throw new Error('strange type of function:', fn);
      }
      return this;
    }

    is(string) {
      if (typeof string !== 'string') {
        throw new Error('is requires string');
      }

      if (typeof is_1[string] !== 'function') {
        throw new Error(`is ${string} is not a function`);
      }
      return this.q(is_1[string])
        .reverse(true);
    }

    and(list) {
      if (!Array.isArray(list)) {
        list = [list];
      }
      if (this._query.length) {
        if (this._union === 'and') {
          this._query = [...this._query, ...list];
        }
      } else if (this._union === 'and') {
        this._query = [...list];
      } else {
        return new Inspector([this, ...list]);
      }
      return this;
    }

    or(list, ifBad = NotSet) {
      if (!Array.isArray(list)) {
        list = [list];
      }
      if (this._query.length) {
        return new Inspector(null, ifBad)
          .or([this, ...list]);
      }
      this._query = [...list];
      this._union = 'or';
      if (!isUnset(ifBad)) {
        this.ifBad(ifBad);
      }

      return this;
    }

    add(list) {
      if (!Array.isArray(list)) {
        this._query = [...this._query, ...list];
      } else {
        this._query = [...this._query, list];
      }
      return this;
    }

    errors(value, ...args) {
      let result = false;

      if (this._union === 'and') {
        result = this._query.reduce((error, test) => {
          if (error) {
            return error;
          }
          return exec(test, value, ...args);
        }, false);
      } else if (this._union === 'or') {
      //  console.log('or items: ', this._query);
        result = this._query.reduce((errors, test) => {
          if (!errors) return false;

          const type = typeof (test);
          let tResult;
          if (test instanceof Inspector) {
            tResult = test.errors(value, ...args);
          }
          if (type === 'function') {
            tResult = test(value, ...args);
          }
          if (type === 'string') {
            if (!is_1.fn(is_1[test])) {
              throw new Error(`${test} is not a function of is`);
            }
            tResult = !is_1[test](value);
          }
          if (!tResult) return false;
          return Array.isArray(tResult) ? [...errors, ...tResult] : [...errors, tResult];
        }, []);
      } else {
        throw new Error(`strange union ${this._union}`);
      }

      //  console.log('queries', this._query, 'union: ', this._union, 'value: ', value, 'result: ', result);
      if (result) {
        return this.onError(value, result);
      }
      return result;
    }

    onError(value, error) {
      let result = error;

      if (is_1.fn(this._ifBad)) {
        result = this._ifBad(value, error);
      } else if (is_1.string(this._ifBad)) {
        result = this._ifBad;
      } else if (is_1.fn(this._ifBad)) {
        result = this._ifBad(value, error, this);
      } else if (result === true) {
        result = `bad value <${s(value)}>`;
      }

      // console.log('onError: value', value, 'error:', error, 'result:', result, 'ifBad: ', this._ifBad);

      if (is_1.string(result)) {
        return result.replace(/%value%/g, s(value))
          .replace(/%name%/g, s(this.name));
      }
      return result;
    }

    isGood(...args) {
      return !this.errors(...args);
    }

    fn() {
      return (...args) => this.errors(...args);
    }
  }

  var inspector = (fn, ifBad = NotSet, name = NotSet) => new Inspector(fn, ifBad, name);

  exports.UNSET = NotSet;
  exports.isUnset = isUnset;
  exports.trial = inspector;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
