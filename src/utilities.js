import is from 'is_js';
import lGet from 'lodash.get';
import NOT_SET from './notSet';

function eString(value, error, params) {
  if (is.function(error)) {
    return error(value, params);
  }
  if (is.string(error)) {
    let token = 'value';
    try {
      token = `${value}`;
    } catch (err) {
      token = 'value';
    }

    return error.replace(/%value%/g, token);
  }

  return error;
}

function doTest(...args) {
  const test = args.shift();

  if (is.function(test)) {
    return test(...args);
  }
  if (is.string(test)) {
    if (test in is) {
      return !is[test](args[0]);
    }
  }
  if (is.object(test) && ('do' in test)) {
    return test.do(...args);
  }

  throw new Error('doTest requires function or Inspector');
}

function orTest(tests, value) {
  if (!Array.isArray(tests)) {
    throw new Error('orTest expects array');
  }
  return tests.reduce((result, test) => {
    if (result === false) {
      return false;
    }
    return doTest(test, value);
  }, NOT_SET);
}

function throwIf(fn) {
  return (value) => {
    const result = ('do' in fn) ? fn.do(value) : fn(value);
    if (result) {
      throw new Error(result);
    }
    return false;
  };
}

function all(fn, props = {}) {
  console.log('all --- props ', props);
  const accept = lGet(props, 'accept', 'ao');
  const typeError = lGet(props, 'typeError', false);
  const returnList = lGet(props, 'returnList', false);
  return (value) => {
    if (!value) {
      return eString(value, typeError, 'value required');
    }

    let orTypeResult = false;
    if ((!value) || (Array.isArray(value) || is.object(value))) {
      orTypeResult = 'all cannot accept value type';
    } else {
      if (Array.isArray(value) && !/a/.test(accept)) {
        orTypeResult = 'all cannot accept array';
      }
      if (!Array.isArray(value) && typeof value === 'object' && !/o/.test(accept)) {
        orTypeResult = 'all cannot accept object';
      }
    }

    if (orTypeResult) {
      console.log('bad type result for all -- ', orTypeResult);
      return eString(value, typeError, orTypeResult);
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; ++i) {
        const val = value[i];
        const err = (doTest(fn, val, i, value));
        if (err) {
          console.log('---- all array error: i-', i, 'val-', val, 'error-', err, 'returnList-', returnList);
          return returnList ? [err, i, val] : err;
        }
      }
    } else { // is an object
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const val = value[key];
        const err = (doTest(fn, val, key, value));

        if (err) {
          console.log(i, key, 'error: ', err, 'returnList', returnList);
          return returnList ? [err, key, val] : err;
        }
      }
    }

    return false;
  };
}

function optional(fn) {
  return (value) => (value ? fn(value) : false);
}

export {
  all, optional, eString, throwIf, orTest, doTest,
};
