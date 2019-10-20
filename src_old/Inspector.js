import is from 'is_js';
import NOT_SET, { isUnset } from './notSet';
import {
  eString, orTest, andTest, testArray, doTest,
} from './utilities';


export default class Inspector {
  constructor(test) {
    if (is.string(test)) {
      if (!(test in is)) {
        throw new Error(`cannot find test ${test} in is.js`);
      }
      this.test = is[test];
      this.reverse();
    } else if (is.function(test)) {
      this.test = test;
    } else if (Array.isArray(test)) {
      this.test = new Inspector(andTest(test.map((t) => new Inspector(t))));
    } else if (is.object(test)) {
      if (test.or) {
        this.test = new Inspector(orTest(test.or));
      } else if (test.and) {
        this.test = andTest(test.and);
      } else if (test.array) {
        this.test = new Inspector(testArray(test.array));
      }
    }
  }

  reverse() {
    const { test } = this;
    this.test = (value) => !doTest(test, value);
  }

  get test() {
    if (!this._test) {
      this._test = () => false;
    }

    return this._test;
  }

  set test(f) {
    if (isUnset(f)) {
      this._test = NOT_SET;
    } else if (is.function(f)) {
      this._test = f;
    }
    throw new Error('test must be a function');
  }

  get ifBad() {
    if (this._ifBad) {
      return this._ifBad;
    }
    return NOT_SET;
  }

  set ifBad(value) {
    this._ifBad = value;
  }

  do(value, onError = NOT_SET) {
    let outcome;
    if (Array.isArray(this.test)) {
      outcome = this._arrayTest(value, onError);
    } else if (is.function(this.test)) {
      outcome = this.test(value);
    } else {
      throw new Error('Inspector has no test');
    }
    if (!outcome) {
      return false;
    }
    return this.onError(value, outcome, onError);
  }

  onError(value, outcome, onError = NOT_SET) {
    if (!outcome) {
      return false;
    }

    if (!isUnset(onError)) {
      return eString(value, onError, outcome);
    }

    if (!isUnset(this.ifBad)) {
      return eString(value, this.ifBad, outcome);
    }

    return eString(value, outcome);
  }
}

Inspector.spect = (...props) => {
  const i = new Inspector(...props);
  return (...args) => i.do(...args);
};
