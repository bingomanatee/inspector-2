/* eslint-disable camelcase */
const tap = require('tap');
const is = require('is_js');
const p = require('./../package.json');
const { doTest, orTest, all } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('doTest', (uDoTest) => {
    function add(...args) {
      return args.reduce((s, v) => s + v, 0);
    }

    uDoTest.same(doTest(add, 1, 2, 3), 6, 'adds numbers');
    uDoTest.same(doTest({ do: add }, 1, 2, 3), 6, 'adds numbers');
    uDoTest.same(doTest('string', 'foo'), false, 'string test false for string');
    uDoTest.same(doTest('string', 2), true, 'string test true for number');

    uDoTest.end();
  });

  suite.test('orTest', (uOrTest) => {
    function isSame([a, b]) {
      return (!(a === b));
    }

    function addsToTen([a, b]) {
      return (!(a + b === 10));
    }

    uOrTest.same(orTest([isSame, addsToTen], [1, 9]), false, 'number is the same or sum to 10');
    uOrTest.same(orTest([isSame, addsToTen], [9, 9]), false, 'number is the same or sum to 10');
    uOrTest.same(orTest([isSame, addsToTen], [9, 2]), true, 'number is not the same or sum to 10');

    uOrTest.end();
  });

  suite.test('allTest', (uAllTest) => {
    function ascending(value, index, list) {
      if (index === 0) {
        return false;
      }
      const last = list[index - 1];
      if (last === value - 1) {
        return false;
      }
      console.log('not ascending -- ', last, value);
      return 'not ascending';
    }

    uAllTest.test('with returnList', (uarTest) => {
      const tr = all(ascending, { returnList: true });

      uAllTest.same(tr([1, 2, 3]), false, 'finds ascending numbers');
      uAllTest.same(tr([1, 2, 3, 10]), ['not ascending', 3, 10], 'finds unascending numbers');

      uarTest.end();
    });

    uAllTest.test('without RL', (uaNRtest) => {
      const t = all(ascending);

      uaNRtest.same(t([1, 2, 3]), false, 'finds ascending numbers');
      uaNRtest.same(t([1, 2, 3, 3]), 'not ascending', 'finds unascending numbers');
      uaNRtest.end();
    });

    uAllTest.end();
  });

  suite.end();
});
