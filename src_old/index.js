import Inspector from './Inspector';
import NOT_SET, { isUnset } from './notSet';
import {
  throwIf, andTest, optional, doTest, orTest, testArray,
} from './utilities';

const { spect } = Inspector;

export {
  Inspector, NOT_SET, isUnset, spect, throwIf, andTest, optional, doTest, orTest, testArray,
};
