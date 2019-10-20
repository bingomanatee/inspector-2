/* eslint-disable camelcase */
const tap = require('tap');
const p = require('./../package.json');
const { trial, isUnset } = require('./../lib/index');

const gt0 = (a) => a <= 0;

tap.test(p.name, (suite) => {
  suite.test('inspector', (inspectorTest) => {
    inspectorTest.test('constructor', (itNewTest) => {
      itNewTest.test('function', (intFn) => {
        const ins = trial(gt0);
        intFn.same(ins._query, [gt0], 'one function');
        intFn.ok(isUnset(ins._ifBad), 'ifBad is unset');
        intFn.same(ins._union, 'and', 'union is and');

        intFn.end();
      });

      itNewTest.test('string', (intStr) => {
        const ins = trial('string');

        intStr.same(ins._query, ['string']);
        intStr.ok(isUnset(ins._ifBad), 'ifBad is unset');
        intStr.same(ins._union, 'and', 'union is and');
        intStr.end();
      });

      itNewTest.test('array', (intArray) => {
        const ins = trial(['number', gt0]);

        intArray.same(ins._query, ['number', gt0], 'is an array of things');
        intArray.ok(isUnset(ins._ifBad), 'ifBad is unset');
        intArray.same(ins._union, 'and', 'union is and');
        intArray.end();
      });

      itNewTest.end();
    });

    inspectorTest.test('errors', (errsTest) => {
      errsTest.test('no ifBad', (etNIBtest) => {
        etNIBtest.test('function', (enFnTest) => {
          const ins = trial(gt0);
          enFnTest.same(ins.errors(2), false, 'returns false on high number');
          enFnTest.same(ins.errors(-1), 'bad value <-1>', 'returns string on low number');
          enFnTest.end();
        });

        etNIBtest.test('string', (enFnTest) => {
          const ins = trial('string');
          enFnTest.same(ins.errors('a string'), false, 'returns false on string');
          enFnTest.same(ins.errors(2), '2 must be a string', 'returns generic string on number');
          enFnTest.end();
        });

        etNIBtest.test('array', (enFnTest) => {
          const ins = trial(['number', gt0]);
          enFnTest.same(ins.errors('a string'), 'a string must be a number', 'returns false on string');
          enFnTest.same(ins.errors(-2), 'bad value <-2>', 'returns generic string on low number');
          enFnTest.same(ins.errors(2), false, 'returns false on high number');
          enFnTest.end();
        });

        etNIBtest.end();
      });

      errsTest.test('string ifBad', (etSIBtest) => {
        etSIBtest.test('function', (enFnTest) => {
          const ins = trial(gt0, '%value% must be > 0');
          enFnTest.same(ins.errors(2), false, 'returns false on high number');
          enFnTest.same(ins.errors(-1), '-1 must be > 0', 'returns string on low number');
          enFnTest.end();
        });

        etSIBtest.test('string', (enSTest) => {
          const ins = trial('string', '%value% must be a string');
          enSTest.same(ins.errors('a string'), false, 'returns false on string');
          enSTest.same(ins.errors(2), '2 must be a string', 'returns formatted string on number');
          enSTest.end();
        });

        etSIBtest.test('array', (enArrayTest) => {
          const ins = trial(['number', gt0]);
          enArrayTest.same(ins.errors('a string'), 'a string must be a number', 'returns false on string');
          enArrayTest.same(ins.errors(-2), 'bad value <-2>', 'returns generic string on low number');
          enArrayTest.same(ins.errors(2), false, 'returns false on high number');
          enArrayTest.end();
        });

        etSIBtest.test('nested', (enNestedTest) => {
          const ins = trial(['number', trial(gt0, '%value% must be > 0')]);
          enNestedTest.same(ins.errors('a string'), 'a string must be a number', 'returns false on string');
          enNestedTest.same(ins.errors(-2), '-2 must be > 0', 'returns formatted string on low number');
          enNestedTest.same(ins.errors(2), false, 'returns false on high number');
          enNestedTest.end();
        });

        etSIBtest.end();
      });

      errsTest.test('nested tests', (nTest) => {
        nTest.test('or test', (orTest) => {
          const numTest = trial(['number', trial(gt0, '%value% must be > 0')]);
          const strTest = trial(['string', trial((n) => n.length < 2, '%value% must be 2 chars or more')]);
          const unionTest = numTest.or(strTest, '%value% is not a valid number or string');

          orTest.same(unionTest.errors([]), '[] is not a valid number or string', 'custom error message');
          orTest.same(unionTest.errors(-1), '-1 is not a valid number or string', 'custom error message');
          orTest.same(unionTest.errors('a'), 'a is not a valid number or string', 'custom error message');
          orTest.same(unionTest.errors(2), false, 'is valid');
          orTest.same(unionTest.errors('long string'), false, 'is valid');
          orTest.end();
        });

        nTest.test('and test', (andTest) => {
          const varTest = trial([
            'string',
            trial((s) => /^[\d]/.test(s), '%value% cannot start with a number'),
            trial((s) => /\s/.test(s), '%value% cannot contain space'),
            trial((s) => /[\W_]/.test(s), '%value% can only be numbers, letters and _'),
          ]);

          andTest.same(varTest.errors(2), '2 must be a string');
          andTest.same(varTest.errors('2pak'), '2pak cannot start with a number');
          andTest.same(varTest.errors('two pak'), 'two pak cannot contain space');
          andTest.same(varTest.errors('two*pak'), 'two*pak can only be numbers, letters and _');
          andTest.same(varTest.errors('aGoodVariable'), false, 'good value');
          andTest.end();
        });

        nTest.end();
      });
      errsTest.end();
    });

    inspectorTest.end();
  });
  suite.end();
});
