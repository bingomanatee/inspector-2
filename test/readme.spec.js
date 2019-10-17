/* eslint-disable camelcase */
const tap = require('tap');
const is = require('is_js');
const p = require('./../package.json');
const { all, spect } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('readme', (rmTest) => {
    rmTest.test('string', (ex1) => {
      const isStringAndYesOrNo = spect(['string', (a) => !/^yes|no$/i.test(a)], 'not yes or no string');
      const eachElementIsYesOrNoString = all(isStringAndYesOrNo, {
        typeError: 'value must be an array',
        accept: 'a',
        returnList: true,
      });
      const isArrayOfYesOrNoStrings = spect(eachElementIsYesOrNoString,
        (feedback) => {
          console.log('isArrayOfYesOrNoStrings feedback:', feedback);
          const [err, index, val] = feedback;
          return `item ${index} (${val} is not a yes or no string`;
        });

      const rootTest = spect({ or: [isStringAndYesOrNo, isArrayOfYesOrNoStrings] });

      ex1.same(isStringAndYesOrNo('yes'), false, 'yes is a good value');
      ex1.same(isStringAndYesOrNo('no'), false, 'yes is a good value');
      ex1.same(isStringAndYesOrNo('f'), 'not yes or no string', 'f is not a valid value');

      ex1.same(rootTest('yes'), false, 'yes is a valid value'); // false
      console.log('=========== rootTest', rootTest('f'));
      ex1.same(rootTest('f'), 'not a yes or no string', 'f is not a valid value');
      //  YNtest(1); // ['not a string or array']
      //  YNtest(['no', 'yes']); // false
      //   YNtest(['yes', 'no', 'f']);

      ex1.end();
    });
    rmTest.end();
  });
  suite.end();
});
