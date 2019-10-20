import is from 'is';
import UNSET, { isUnset } from './notSet';

function s(n) {
  if (isUnset(n)) {
    return '';
  }
  if (is.string(n)) {
    return n;
  }
  if (is.symbol(n)) {
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
    if (!is.fn(is[test])) {
      throw new Error(`${s(test)} is not a function of is`);
    }
    const out = !is[test](value);
    if (out) {
      return `${value} must be a ${test}`;
    }
    return out;
  }
  // @todo: array?
  return UNSET;
}

class Inspector {
  constructor(fn = UNSET, ifBad = UNSET, name = UNSET) {
    if (name) {
      this.name = name;
    }
    this._query = [];
    this._union = 'and';
    this.q(fn)
      .ifBad(ifBad);
  }

  ifBad(handler = UNSET) {
    this._ifBad = handler;
    return this;
  }

  each(...args) {
    const testItem = new Inspector(...args);
    const each = (list) => {
      const result = list.reduce((out, item, i) => {
        if (!isUnset(out)) {
          return out;
        }
        return exec(testItem, item, i, list);
      }, UNSET);
      if (isUnset(result)) {
        return false;
      }
      return result;
    };
    return this.and([
      new Inspector('array'),
      each,
    ]);
  }


  eachWithDetail(test, ifError = UNSET) {
    const testIns = new Inspector(test);
    const each = (list) => {
      const result = list.reduce((out, item, i) => {
        if (!isUnset(out)) {
          return out;
        }
        const error = exec(testIns, item, i, list);
        if (error) {
          return [error, item, i, list];
        }
        return false;
      }, UNSET);
      if (isUnset(result)) {
        return false;
      }
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
      if (typeof is[fn] !== 'function') {
        throw new Error(`${fn} is not a valid test`);
      }
      this._query.push(fn);
    } else if (fn instanceof Inspector) {
      this._query.push(fn);
    } else if (Array.isArray(fn)) {
      if (!fn.length) {
        return this;
      }
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

    if (typeof is[string] !== 'function') {
      throw new Error(`is ${string} is not a function`);
    }
    return this.q(is[string])
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

  or(list, ifBad = UNSET) {
    if (!this._query.length) {
      this.q(list);
      this._union = 'or';
      return this;
    }

    const insp = new Inspector(this, ifBad)
      .q(list);
    insp._union = 'or';
    return insp;
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
        if (!errors) {
          return false;
        }
        const tResult = exec(test, value, ...args);
        if (!tResult) {
          return false;
        }
        if (isUnset(errors)) {
          return Array.isArray(tResult) ? tResult : [tResult];
        }
        return Array.isArray(tResult) ? [...errors, ...tResult] : [...errors, tResult];
      }, UNSET);
    } else {
      throw new Error(`strange union ${this._union}`);
    }

    // console.log('errors: queries', this._query, 'union: ', this._union, 'value: ', value, 'result: ', result);

    if (result) {
      return this.onError(value, result);
    }
    return result;
  }

  onError(value, error) {
    let result = error;

    if (is.fn(this._ifBad)) {
      result = this._ifBad(value, error);
    } else if (is.string(this._ifBad)) {
      result = this._ifBad;
    } else if (is.fn(this._ifBad)) {
      result = this._ifBad(value, error, this);
    } else if (result === true) {
      result = `bad value <${s(value)}>`;
    }

    // console.log('onError: value', value, 'error:', error, 'result:', result, 'ifBad: ', this._ifBad);

    if (is.string(result)) {
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

export default (fn, ifBad = UNSET, name = UNSET) => new Inspector(fn, ifBad, name);
