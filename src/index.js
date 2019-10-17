import Inspector from './Inspector';
import NOT_SET, { isUnset } from './notSet';

const { spect } = Inspector;

function throwIf(fn) {
  return (value) => {
    const result = (fn instanceof Inspector) ? fn.do(value) : fn(value);
    if (result) {
      throw new Error(result);
    }
    return false;
  };
}

export {
  Inspector, NOT_SET, isUnset, spect, throwIf,
};
