/* eslint-disable camelcase */
const tap = require('tap');
const is = require('is_js');
const p = require('./../package.json');
const { isUnset, Inspector, spect } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('constructor', (consTest) => {
    consTest.test('string', (constTestFO) => {
      const isGreaterThanZero = new Inspector('number');

      constTestFO.ok(is.function(isGreaterThanZero.test), 'string puts function into testd');
      constTestFO.ok(isUnset(isGreaterThanZero.ifBad), 'ifBad is unset');
      constTestFO.ok(isGreaterThanZero.do('str'));
      constTestFO.notOk(isGreaterThanZero.do(1));

      constTestFO.end();
    });

    consTest.test('function only', (constTestFO) => {
      const gt0 = (n) => n > 0;
      const isGreaterThanZero = new Inspector(gt0);

      constTestFO.same(isGreaterThanZero.test, gt0, 'function test is put in test property');
      constTestFO.ok(isUnset(isGreaterThanZero.ifBad), 'ifBad is unset');

      constTestFO.end();
    });

    consTest.test('array of arrays', (aofTest) => {
      function gt0(n) {
        return n > 0;
      }

      function isNumber(n) {
        return !is.number(n);
      }

      const numGT0 = new Inspector([[gt0, 'greater than zero'], [isNumber, 'not a number']]);
      aofTest.same(numGT0.test[0].test, gt0, 'first test is gt0');
      aofTest.same(numGT0.test[0].ifBad, 'greater than zero', 'ifBad is string');
      aofTest.same(numGT0.test[1].test, isNumber, 'second test is isNumber');
      aofTest.same(numGT0.test[1].ifBad, 'not a number', 'ifBad is string');
      aofTest.notOk(numGT0._or, 'is an and not an or');
      aofTest.ok(isUnset(numGT0.ifBad), 'ifBad is unset');

      aofTest.end();
    });

    consTest.test('array of functions', (aofTest) => {
      function gt0(n) {
        return n > 0;
      }

      function isNumber(n) {
        return !is.number(n);
      }

      const numGT0 = new Inspector([gt0, isNumber]);
      aofTest.same(numGT0.test[0].test, gt0, 'first test is gt0');
      aofTest.ok(isUnset(numGT0.test[0].ifBad), 'ifBad is unset');
      aofTest.same(numGT0.test[1].test, isNumber, 'second test is isNumber');
      aofTest.ok(isUnset(numGT0.test[1].ifBad), 'ifBad is unset');
      aofTest.notOk(numGT0._or, 'is an and not an or');
      aofTest.ok(isUnset(numGT0.ifBad), 'ifBad is unset');

      aofTest.end();
    });

    consTest.end();
  });

  suite.test('single validation', (singleValidation) => {
    singleValidation.test('without ifBad', (tiNoIfBad) => {
      const isString = spect('string');
      tiNoIfBad.same(isString('a string'), false, 'if string, result should be false');
      tiNoIfBad.same(isString(1), true, 'if not string result should be true');

      const isLongString = spect((value) => (typeof value !== 'string') || value.length < 4);
      tiNoIfBad.same(isLongString('st'), true, 'short string is an error');
      tiNoIfBad.same(isLongString(3), true, 'number is an error');
      tiNoIfBad.same(isLongString('long string'), false, 'long string is not an error');

      tiNoIfBad.end();
    });

    singleValidation.test('with ifBad', (tiWithIfBad) => {
      tiWithIfBad.test('tiwiStrTest', (tiwiStrTest) => {
        const isString = spect('string', '%value% must be a string');
        tiwiStrTest.same(isString('a string'), false, 'if string, result should be false');
        tiwiStrTest.same(isString(1), '1 must be a string', 'if not string result should be true');
        tiwiStrTest.end();
      });

      tiWithIfBad.test('functional test', (tiwiFnTest) => {
        const isLongString = spect((value) => ((typeof value !== 'string') ? '%value% must be a string' : (value.length < 4) ? '%value% must be 4 chars or more' : false));
        tiwiFnTest.same(isLongString('st'), 'st must be 4 chars or more', 'short string is an error');
        tiwiFnTest.same(isLongString(3), '3 must be a string', 'number is an error');
        tiwiFnTest.same(isLongString('long string'), false, 'long string is not an error');
        tiwiFnTest.end();
      });

      tiWithIfBad.end();
    });

    singleValidation.end();
  });

  suite.test('and validation', (andValidation) => {
    const longStringNoSpaces = spect([
      ['string', '%value% must be a string'],
      [(a) => a.length < 4, '%value% must be >= 4 chars'],
      [(a) => /[\s]+/.test(a), 'cannot have spaces'],
    ]);

    andValidation.same(longStringNoSpaces(2), '2 must be a string', 'number is error');
    andValidation.same(longStringNoSpaces('a'), 'a must be >= 4 chars', 'string too short');
    andValidation.same(longStringNoSpaces('a long string with spaces'), 'cannot have spaces', 'cannot have spaces');
    andValidation.same(longStringNoSpaces('a-long-string-without-spaces'), false, 'passes');

    andValidation.end();
  });

  suite.test('or validation', (orValidation) => {
    const isTwitProp = spect({
      or: [
        spect(['string', (s) => !/^@[\w]+$/.test(s)]),
        spect(['string', (s) => !/^#[\w]+$/.test(s)]),
      ],
      ifBad: 'is not twitter variable',
    });

    orValidation.same(isTwitProp(2), 'is not twitter variable');
    orValidation.same(isTwitProp('foo'), 'is not twitter variable');
    orValidation.same(isTwitProp('@foo'), false, 'is twitter variable');
    orValidation.same(isTwitProp('#foo'), false, 'is twitter variable');

    orValidation.end();
  });

  suite.end();
});
