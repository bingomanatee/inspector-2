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

function doTest(test, ...args) {
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

function testArray(fn, postTest) {
  return (value) => {
    if (!Array.isArray(value)) {
      return 'value must be an array';
    }
    const results = value.map((item, i) => doTest(fn, item, i, value));

    if (postTest) return postTest(results, value);

    if (results.reduce((out, item) => out || item, false)) {
      return { value, results };
    }
    return false;
  };
}

function orTest(fnList) {
  if (!Array.isArray(fnList)) {
    throw new Error('orTest requires array');
  }

  return (value) => {
    const results = fnList.map((fn) => doTest(fn, value));
    if (results.map((out, result) => out && result, true)) return false;
    return results.filter((a) => a);
  };
}

function throwIf(fn) {
  return (value) => {
    const result = doTest(value, fn);
    if (result) {
      throw new Error(result);
    }
    return false;
  };
}

function andTest(fnList) {
  if (!Array.isArray(fnList)) {
    throw new Error('andTest requires array');
  }
  return (value) => {
    const results = fnList.map((fn) => doTest(fn, value));
    if (results.map((out, result) => out || result, false)) return results.filter((a) => a);
    return false;
  };
}

function optional(fn) {
  return (value) => (value ? fn(value) : false);
}

export {
  andTest, optional, eString, throwIf, orTest, doTest, testArray,
};
