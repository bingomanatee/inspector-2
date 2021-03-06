const { inspect } = require('util');

/* eslint-disable camelcase */
const tap = require('tap');
const p = require('./../package.json');
const { trial, isUnset } = require('./../lib/index');

const gt0 = (a) => a <= 0;

tap.test(p.name, (suite) => {
  suite.test('inspector', (inspectorTest) => {
    inspectorTest.test('readme', (rmTest) => {
      rmTest.test('1. String or array of yes no', (sYNtest) => {
        const isStringYesOrNo = trial(['string', (a) => !/^yes|no$/.test(a)],
          '%value% is not a yes or no string', 'isStringYesOrNo');
        const eachElementIsYesOrNoString = trial()
          .each(isStringYesOrNo);

        const isYNorArrayOfYN = trial(isStringYesOrNo)
          .or(eachElementIsYesOrNoString, (value, error) => {
            if (Array.isArray(error)) {
              return error.join(' and ');
            }
            return error;
          });

        sYNtest.same(isStringYesOrNo.errors(2), '2 is not a yes or no string', 'numbers fail');
        sYNtest.same(isStringYesOrNo.errors('foo'), 'foo is not a yes or no string', 'numbers fail');
        sYNtest.same(isStringYesOrNo.errors('yes'), false, 'passes');

        sYNtest.same(eachElementIsYesOrNoString.errors(2), '2 must be a array', 'non list fails with array message');
        sYNtest.same(eachElementIsYesOrNoString.errors([2]), '2 is not a yes or no string', 'non list fails with array message');
        sYNtest.same(eachElementIsYesOrNoString.errors(['yes', 'no', 'yes']), false, 'good data');

        sYNtest.same(isYNorArrayOfYN.errors(2), '2 is not a yes or no string and 2 must be a array');
        sYNtest.same(isYNorArrayOfYN.errors([2]), '[2] is not a yes or no string and 2 is not a yes or no string', 'non list fails with array message');
        sYNtest.same(isYNorArrayOfYN.errors(['yes', 'no', 'yes']), false, 'good data');
        sYNtest.same(isYNorArrayOfYN.errors('yes'), false, 'good data');

        sYNtest.end();
      });

      rmTest.test('ascending - basic ', (ascTest) => {
        const isAscending = trial()
          .each(['integer', (value, index, list) => {
            if (index === 0) {
              return false;
            }
            const prev = list[index - 1];

            return prev + 1 !== value;
          }]);

        isAscending.errors(['a']);
        ascTest.same(isAscending.errors(1), '1 must be a array', 'fails first test');
        ascTest.same(isAscending.errors(['a']), 'a must be a integer', 'fails array of bad values');
        ascTest.same(isAscending.errors([1, 2, 3]), false, 'good data');
        ascTest.same(isAscending.errors([1, 2, 4]), 'bad value <4>', 'bad ascending');

        ascTest.end();
      });

      rmTest.test('ascending', (ascTest) => {
        const isAscending = trial()
          .eachWithDetail(['integer', (value, index, list) => {
            if (index === 0) {
              return false;
            }
            const prev = list[index - 1];

            return prev + 1 !== value;
          }], (value, [error, item, index, list]) => {
            if (/bad value/.test(error)) {
              return `${item} ([${index}]) is not one more than ${list[index - 1]}`;
            }
            return error;
          });

        isAscending.errors(['a']);
        ascTest.same(isAscending.errors(1), '1 must be a array', 'fails first test');
        ascTest.same(isAscending.errors(['a']), 'a must be a integer', 'fails array of bad values');
        ascTest.same(isAscending.errors([1, 2, 3]), false, 'good data');
        ascTest.same(isAscending.errors([1, 2, 4]), '4 ([2]) is not one more than 2', 'bad ascending');

        ascTest.end();
      });

      rmTest.test('optional', (opt) => {
        const emailTest = trial([
          'string',
          trial((s) => !/^[\w]+@[\w]+\.[\w]+$/.test(s), '%value% is not a valid email'),
        ]);

        const optionalEmail = trial((a) => !!a)
          .or(emailTest, (value, errors) => {
            if (Array.isArray(errors)) {
              return errors.reduce((err, item) => {
                if (/not a valid email/.test(err)) return err;
                return item;
              });
            }
            return errors;
          });

        opt.same(emailTest.errors(''), ' is not a valid email');
        opt.same(emailTest.errors('foo'), 'foo is not a valid email');
        opt.same(emailTest.errors(2), '2 must be a string');
        opt.same(emailTest.errors('foo@bar.com'), false);

        opt.same(optionalEmail.errors(''), false);
        opt.same(optionalEmail.errors('foo'), 'foo is not a valid email');
        opt.same(optionalEmail.errors(2), '2 must be a string');
        opt.same(optionalEmail.errors('a@b.com'), false);

        opt.end();
      });

      rmTest.end();
    });
    inspectorTest.end();
  });

  suite.end();
});
