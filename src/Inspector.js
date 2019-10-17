import is from 'is_js';
import NOT_SET, { isUnset } from './notSet';
import { eString, orTest } from './utilities';

const GOOD_PARAMS = 'test,ifBad,name,and,or'.split(',');

export default class Inspector {
  constructor(...args) {
    this.test = () => false;
    let props = args[0];
    if (args.length > 1) {
      const [test, ifBad] = args;
      props = { test, ifBad };
    } else if (Array.isArray(props)) {
      props = { test: props };
    }

    if (!props) {
      return;
    }

    // eslint-disable-next-line default-case

    switch (typeof (props)) {
      case 'string':
        if (props in is) {
          this.test = (value) => !is[props](value);
        } else {
          throw new Error(`unknown test ${props}`);
        }
        break;

      case 'object':
        Object.assign(this, Object.keys(props).reduce((o, key) => {
          if (GOOD_PARAMS.includes(key)) {
            o[key] = props[key];
          }
          return o;
        }, {}));
        break;

      case 'function':
        this.test = props;
        break;
    }
  }

  get test() {
    if (!this._test) {
      this._test = () => false;
    }

    return this._test;
  }

  set test(f) {
    if (Array.isArray(f)) {
      this.setAnd(f);
    } else {
      switch (typeof (f)) {
        case 'string':
          if (f in is) {
            this._test = (value) => !is[f](value);
          } else {
            throw new Error(`unknown test ${f}`);
          }
          break;

        case 'function':
          this._test = f;
          break;

        default:
          throw new Error('test must be an array, function or string');
      }
    }
  }

  set and(value) {
    this.setAnd(value);
  }

  set or(value) {
    this.setOr(value);
  }

  setOr(...args) {
    this.setAnd(...args);
    this._or = true;
  }

  setAnd(tests, ifBad = NOT_SET) {
    if (Array.isArray(tests)) {
      const testList = tests.map((condition) => {
        if (condition instanceof Inspector) {
          return condition;
        }
        if (Array.isArray(condition)) {
          return new Inspector(...condition);
        }
        return new Inspector(condition);
      });

      if (!isUnset(ifBad)) {
        if (Array.isArray(ifBad)) {
          for (let i = 0; i < ifBad.length; ++i) {
            if (i < testList.length) {
              testList[i].ifBad = ifBad[i];
            }
          }
        } else {
          this.ifBad = ifBad;
        }
      }
      this._test = testList;
    } else {
      throw new Error('Inspector.setAnd expects array');
    }

    return this;
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

  _arrayTest(value) {
    let outcome;
    if (this._or) {
      outcome = orTest(this.test, value);
    } else {
      outcome = this.test.reduce((result, test) => {
        if (!isUnset(result)) {
          return result;
        }
        return test.do(value);
      }, NOT_SET);
    }
    return isUnset(outcome) ? false : outcome;
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
