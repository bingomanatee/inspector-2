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

  each(test) {
    const each = (list) => {
      const result = list.reduce((out, item, i) => {
        if (!isUnset(out)) return out;
        return exec(test, item, i, list);
      }, UNSET);
      if (isUnset(result)) return false;
      return result;
    };
    return this.and([
      new Inspector('array'),
      each,
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

  errors(value) {
    let result = false;

    if (this._union === 'and') {
      result = this._query.reduce((error, test) => {
        if (error) {
          return error;
        }
        return exec(test, value);
      }, false);
    } else if (this._union === 'or') {
    //  console.log('or items: ', this._query);
      result = this._query.reduce((errors, test) => {
        if (!errors) return false;

        const type = typeof (test);
        let tResult;
        if (test instanceof Inspector) {
          tResult = test.errors(value);
        }
        if (type === 'function') {
          tResult = test(value);
        }
        if (type === 'string') {
          if (!is.fn(is[test])) {
            throw new Error(`${test} is not a function of is`);
          }
          tResult = !is[test](value);
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
