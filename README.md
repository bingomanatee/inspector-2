Inspector evaluates things using one or more tests and returns validation results. The reason I'm writing it is
that validation libraries that exist don't seem to express boolean series well -- i.e., 
"the value either doesn't exist or it meets these conditions" or "the value passes one of these tests".

Writing single tests are easy. In fact we use the `is_js` library for type and other simple tests. 

When you compound tests things get complicated. For instance:

* If a value is required how do you handle zero?
* If you have multiple tests, do you execute all of them if the first fails?
* What if there are multiple possibilities, each of which should be sub-validated?
  as in, "Should be a string('yes' or 'no') or an array of strings ('yes' or 'no)"
  
## A big messy validator

Lets take that last case.
If you pass a string, it validates by a regex to yes or no.
If it is passed an array, it validates each element by the above tests -- IF the element is a string.
If it is passed a non-string/array it fails. 

Seems simple but there is a lot of branches here:

```
isYesNoStringOrArrayOfYesNoStrings
  'string' -- type test
  if string: 
      stringIsYesOrNo:
      test string for 'yes/no' equality
          if true
              return false
          else
              returns "string is not yes or no"
  else: 
      isArrayAndArrayOfYesNoStrings
          if array:
              if eachElementIsYesOrNoString
                    for each element 
                       if stringIsYesOrNo(element) is an error
                           return element, index and error
                       else 
                           return false;
              compose error message based on index, error, and value
          else: (failed string and array type tests)
              'not an array or a string'
```

Inspector is a DSL for these kind of logical relationships:

```javascript
const isStringAndYesOrNo = spect(['string', a => /^yes|no$/.test(a)], 'not yes or no string');
const eachElementIsYesOrNoString = all(isStringAndYesOrNo, 'a', true);
const isArrayOfYesOrNoStrings = spect(eachElementIsYesOrNoString, ([err, index, val]) => {
return `item ${i} (${val} is not a yes or no string`
});

const YNtest = spect([isStringAndYesOrNo, isArrayOfYesOrNoStrings])

YNtest('yes');               // false
YNtest('f');                 // ['string is not yes or no']
YNtest(1);                   // ['not a string or array']
YNtest(['no', 'yes']);       // false
YNtest(['yes', 'no', 'f' ]); // ['array element 2 failed - (f) string is not yes or no']

```
Some notes on the root YNtest block:

* the outer block is an "or". it stops executing as soon as one of its tests is true and
  returns that result. it captures each result as an inner 'or' test then inverts
  the result with the outer 
* The first test is a type test; the value is a string or an array, it returns false;
  otherwise it returns a string('not a string or array') and stops.
* The second test executes if the value is a string; it executes a simple regex test 
  and if the test fails, returns an error string('string is not yes or no').
* The third test executes if the value is an array; it runs the string test 
  over each element and on failure, describes which cell failed. 

The same code with annotation

```javascript
// the basic test -- assumes input is a string
const stringIsYesOrNo = ifFn(a => /^yes|no$/.test(a), false, 'string is not yes or no');
// executes the above IF input is a string
const isStringAndYesOrNo = ifFn('string', stringIsYesOrNo, 'non string');
// tests each values of the array -- assumes input is an array
const eachElementIsYesOrNoString = list => {
  return list.reduce((m, value, index) => m || (error => error && {
    value, index, error
  })(isStringAndYesOrNo(value)), false);
};
const isArrayOfYesOrNoStrings = ifFn(eachElementIsYesOrNoString, (badValue, error) => {
return `array element ${error.index} failed - (${error.value}) ${error.error}`;
});

const YNtest = validator(orFn(
  [andFn(
    'string',
    'array',
  ), 'not a string or array'],
  ['string', stringIsYesOrNo],
  ['array', isArrayOfYesOrNoStrings],
));

YNtest('yes');               // false
YNtest('f');                 // ['string is not yes or no']
YNtest(1);                   // ['not an array or a string']
YNtest(['no', 'yes']);       // false
YNtest(['yes', 'no', 'f' ]); // ['array element 2 failed - (f) string is not yes or no']

```

validator returns false if the value passes, and an array of the first failed error
if the test result is truthy.

A large amount of logic can be tied together with testable sub-assertions. 

## The Building Blocks

### Some important principles

#### "False is the new true"

In inspector, "false is the new true"; false(y) means a test value has passed (none of the tests have failed)
the expected test, but non-falsy value indicates a failure, explained by the result.

#### "boolean collectors don't keep testing if they get a terminal result"

* andFn (collector(tests, 'and')) stops executing when a test returns a positive value (fails).
* orFn (collector(tests, 'orl)) stops executing when a test returns a negative value (succeeds).

so,

```javascript

const isBob = orFn('string',(a) => /^Bob/.test(a) ? false : 'not bob')

```

is safe because when the string test returns an error ('not a string') the regex will never be hit. 

### Iffn (ifFunctions)

Inspector is built using functional principles of map-reduce. 
Tests are expressed in iffns -- if functions that create functions 
from the building blocks of `test, ifTrue, ifFalse`. 

For the purposes of validation `false` means "no errors", the expected result of a valid variable. 
There is one shorthand here, testing for type by name (as a key to the `is` module) 
is evaluated by iffn as `is[name], false, 'not a [name]'`. 

ifFn returns a function; also if there ifTrue and ifFalse are empty, the original function is returned. for that reason, 

```javascript

const posFn = ifFn(a => a > 0, false, 'negative');
const posFunction = (value) => a > 0 ? false : 'negative';

const posFunctionTested = ifFn(posFn);
// posFunctionTested is exactly equal to posFn - it is returned unchanged. 

const negFn = ifFn(posFn, 'positive');
// negFunction returns a value when posFn does not. 
````

### collectors 

```javascript

collector(tests, reducer?)

```
* **tests**:  function |  string | [(function | string | [function, ifFalse, ifTrue])...]
* **reducer**: 'and', 'or', function, [function, startValue]

collectors are tuneable map-reducers that collect the results of arrays of tests 
and return the non-zero results depending on the setting of the setting of the reducer. 
If there are no true results, false is returned. If there are true results results vary
depending on the value of the second argument(reducer).

#### Logical reducers

* by default (no reducer value) all truthy results are returned in an array
  (unless there are none in which case false is returned.)
* if passed 'and', false is returned unless ALL of the results are truthy, 
  in which case they are returned in an array.
* if passed 'or', the first truthy result is returned; if none, false is returned.

'and' or 'or' tests don't necessarily execute all condition tests; and will stop executring
after the first false result, and or will stop after the first true result. 

#### Logical reducer shortcuts

`andFn(...tests)` is equal to `collector([tests], 'and')`;
`orFn(...tests)` is equal to `collector([tests], 'or')`;

```javascript
/* global collector */

const is123 = collector(
[
  [a => a === 1, 'one'],
  [a => a === 2, 'two'],
  [a => a === 3, 'three'],
],
'or',
);

console.log(is123(1)) // 'one'
console.log(is123(4)) // false

const not123 = collector(
  [
    [a => a === 1, false, 'not one'],
    [a => a === 2, false, 'not two'],
    [a => a === 3, false, 'not three'],
  ],
  'and',
);

console.log(not123(1)); // false
console.log(not123(4)).toEqual(['not one', 'not two', 'not three']); // failed all the tests

```

#### true reduction

If the reducer is a function, this works as a map reducer.

If the reducer is an array it is passed as a reducer with the first value being the iterator:

``` javascript
collector([a => a, a => a + 1, a => a + 2], (m, value) => (value * 5) + m)(0)
// 15
collector([a => a, a => a + 1, a => a + 2], [(m, value) => (value * 5) + m, 100])(0)
// 115
```

## The Validators

```javascript

validator(tests, {required, onFail});

/**
  * if it is an array:
  *    if onFail is set:
  *       each sub-array will be composed into an ifFn
  *       each function in tests will be composed into an ifFn, using onFail as the failure case
  *    otherwise:
  *       each sub-array will be composed into an ifFn
  *       each function will be returned un-altered
  * if it is a function
  *    if onFail is set
  *       the function will be composed into a one-item array of an ifFn
  *    else
  *       the function will be put in an array un-altered.
  *
  * so in sum, onFail will reverse the output of functions in an array
  */

```

## Required

Required, the argument to the object that is the second parameter to the validator
function can be omitted. 
If required is passed in, then one of two situations will occur:

* **if required is true** then any falsy values passed in throw an error (and no tests are executed).
* **if required is false** then any falsy values *pass automatically* (and no tests are executed).
* **if required is omitted** then the tests are composed into a collector with an "or" reduction pattern.

### Required is not required. 

That is because there are three scenarios for values:

* the value must be truthy (required), and non-truthy values failures are an error.
* the value is not required, and falsy values shouldn't be tested. 

Note - in BOTH of these scenarios there are a class of values that won't be tested.
What if you want to test a value that is numeric but not zero?

if you say the value is required, than zero would fail automatically
because it is falsy. 

if you say it is not required, then '' would pass, because it is falsy,
and will never be tested for numeracy. 

so instead we pass NOTHING for the value of required and falsiness is not examined
by validator. 

```
tests                              onfail               required  value  result
-------------------------------------------------------------------------------------------------
['number', a => a < 0, a => a % 2] 'not positive even'  false      0     false

['number', a => a < 0, a => a % 2] 'not positive even'  (not set)  0     'not positive even'  

['number', a => a < 0, a => a % 2] 'not positive even'  false      ''    false

['number', a => a < 0, a => a % 2] 'not positive even'  (not set)  ''    'not an number'      

```

```javascript
const v = validator([[a => a === 0, false, 'not zero']]);

console.log(v(0)); // false
console.log(v('')); // ['not zero'];
console.log(v(1)); // ['not zero'];

```
