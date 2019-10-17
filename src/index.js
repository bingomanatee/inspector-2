import Inspector from './Inspector';
import NOT_SET, { isUnset } from './notSet';
import {
  throwIf, all, optional, doTest, orTest,
} from './utilities';

const { spect } = Inspector;

export {
  Inspector, NOT_SET, isUnset, spect, throwIf, all, optional, doTest, orTest,
};
