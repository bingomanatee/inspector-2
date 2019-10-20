# Inspector: a complex validation engine for multi-part validation

Inspector is a javascript library for creating value tests. 

Inspector evaluates things using one or more tests and returns validation results. The reason I'm writing it is
that validation libraries that exist don't seem to express boolean series well -- i.e., 
"the value either doesn't exist or it meets these conditions" or "the value passes one of these tests".

Writing single tests are easy. In fact we use the `is` library for type and other simple tests. 

When you compound tests things get complicated. For instance:

* If a value is required how do you handle zero?
* If you have multiple tests, do you execute andTest of them if the first fails?
* What if there are multiple possibilities, each of which should be sub-validated?
  as in, "Should be a string('yes' or 'no') or an array of strings ('yes' or 'no)"

Also for compound tests, it is messy and verbose to customize error conditions for each and every
way a value can fail. 

<font color=red>** WARNING **: inspector 2.0 has a wholly different than inspector 1.0. </font>
  
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
const isStringYesOrNo = trial(['string', (a) => !/^yes|no$/.test(a)],
  '%value% is not a yes or no string', 'isStringYesOrNo');
const eachElementIsYesOrNoString = trial()
  .each(isStringYesOrNo);

const isYNorArrayOfYN = trial(isStringYesOrNo)
  .or(eachElementIsYesOrNoString, (value, error) => {
    if (Array.isArray(error)) return error.join(' and ');
    return error;
  });

console.log(isYNorArrayOfYN.errors(2)); // '2 is not a yes or no string and 2 must be a array');
console.log(isYNorArrayOfYN.errors([2])); // '[2] is not a yes or no string and 2 is not a yes or no string');
console.log(isYNorArrayOfYN.errors(['yes', 'no', 'yes'])); // false
console.log(isYNorArrayOfYN.errors('yes')); // false

```
Some notes on the root YNtest block:

* The first test is a string test; the array crates an implicit "and" so if the value is not a string, it doesn't have to do the second test.
* The second test is an "each". It contains an implicit array test, then runs the test to each of the elements of the input value
* the outer block (isYNorArrayOfYN) is an "or". it stops executing as soon as one of its tests is true and returns that result. it captures each result as an inner 'or' test and if none of them pass it has a custom error function that joins the error messages from each of the tests. 

Note the isStringYesOrNo test is reused - once as an iterator test for the each, 
and again as one of the forks of the "or" test.

# The Building Blocks

`trial(test, errorFilter?)` returns an Inspector instance. Inspectors contain a test *or an array of tests* that are executed over a value when the inspectors' `error(value)` method. 

Optionally you can define an error filter - a function `(value, error) => ... :string` or a string template. String templates replace the tokens '%value%' with the input value. 

## False is the new true

In trial, "false is the new true"; false(y) means a test value has passed (none of the tests have failed)
the expected test, but non-falsy value indicates a failure, explained by the result.

## Passing a string will extract a test from `is`.

Inspector translates strings as function references to the [is](https://www.npmjs.com/package/is) npm library. (not to be confused with the `is.js` library) For convenience,

here is the `is` function list:

### General

 - ``is.a`` (value, type) or ``is.type`` (value, type)
 - ``is.defined`` (value)
 - ``is.empty`` (value)
 - ``is.equal`` (value, other)
 - ``is.hosted`` (value, host)
 - ``is.instance`` (value, constructor)
 - ``is.instanceof`` (value, constructor) - deprecated, because in ES3 browsers, "instanceof" is a reserved word
 - ``is.nil`` (value)
 - ``is.null`` (value) - deprecated, because in ES3 browsers, "null" is a reserved word
 - ``is.undef`` (value)
 - ``is.undefined`` (value) - deprecated, because in ES3 browsers, "undefined" is a reserved word

### Arguments

 - ``is.args`` (value)
 - ``is.arguments`` (value) - deprecated, because "arguments" is a reserved word
 - ``is.args.empty`` (value)

### Array

 - ``is.array`` (value)
 - ``is.array.empty`` (value)
 - ``is.arraylike`` (value)

### Boolean

 - ``is.bool`` (value)
 - ``is.boolean`` (value) - deprecated, because in ES3 browsers, "boolean" is a reserved word
 - ``is.false`` (value) - deprecated, because in ES3 browsers, "false" is a reserved word
 - ``is.true`` (value) - deprecated, because in ES3 browsers, "true" is a reserved word

### date

 - ``is.date`` (value)

### element

 - ``is.element`` (value)

### error

 - ``is.error`` (value)

### function

 - ``is.fn`` (value)
 - ``is.function`` (value) - deprecated, because in ES3 browsers, "function" is a reserved word

### number

 - ``is.number`` (value)
 - ``is.infinite`` (value)
 - ``is.decimal`` (value)
 - ``is.divisibleBy`` (value, n)
 - ``is.integer`` (value)
 - ``is.int`` (value) - deprecated, because in ES3 browsers, "int" is a reserved word
 - ``is.maximum`` (value, others)
 - ``is.minimum`` (value, others)
 - ``is.nan`` (value)
 - ``is.even`` (value)
 - ``is.odd`` (value)
 - ``is.ge`` (value, other)
 - ``is.gt`` (value, other)
 - ``is.le`` (value, other)
 - ``is.lt`` (value, other)
 - ``is.within`` (value, start, finish)

### object

 - ``is.object`` (value)

### regexp

 - ``is.regexp`` (value)

### string

 - ``is.string`` (value)

### encoded binary

 - ``is.base64`` (value)
 - ``is.hex`` (value)

### Symbols
 - ``is.symbol`` (value)

### BigInts
 - ``is.bigint`` (value)

## Inspectors can be passed as tests of other inspectors

As shown in the first examples, Inspectors -- or arrays of inspectors --- can be passed to the trial factory,
or any of an inspectors' currying methods -- `and(test)`, `or(test)`, and `each(test)`. This is how you can create large
branching complex tests. 

## `and(...)` inspectors (the default) stop testing if they find an error

so,

```javascript

const isBob = trial('string')
.and(trial((a) => !/^Bob/.test(a), 'not Bob'));

```

the regex is safe because if the first test fails, the second test is omitted. 

Passing an array of inspectors to `trial(['number', isGT0, isInteger])` is the same as `trial('number').and([isGTO, isInteger])`.

## `or(...)` inspectors stop testing once they *don't* find an error

conversely or tests stop on the first passed test (function that results in a false value). 

```javascript

const neg = trial(['number', a => a > 0],  '%value% must be negative');
const zero = trial(['number', a => a !== 0], '%value must be zero');
const pos = trial(['number', (a) => a < 0], '%value%e must be positive');

const wholeNumber = trial(pos)
.or(zero);
const nonPosNumber = trial(neg)
.or(zero)

````

`wholeNumber` will succeed if the number is positive OR zero. 

`nonPositiveNumber` will succeed if the number is negative OR zero. 

both tests will only run the first test, unless the number is zero. 

## `or(..., onFail)` inspectors product an array of errors; best to provide a custom onFail

Because the error is not failure on a single test but failure of *all* the tests, its best to provide a custom error message
(either a string or function to interpret the arrays if you want). 

## `.each()` (iterators) apply the test to all elements in an array.  

as a shortcut, if you want to test every element of an array. you can call the `.each(test)` 
on the trial result, and the input will be automatically validated for array-ness, and 
the value will only succeed if each element in the array passes the test that is the argument for the 
`.each(test)` method. See the first example for array testing.  

The test is provided not only the value, but the index and the entire list. 

```javascript

const isAscending = trial()
  .each(['integer', (value, index, list) => {
    if (index === 0) return false;
    const prev = list[index - 1];

    return prev + 1 !== value;
  }]);

isAscending.errors(['a']);
console.log(isAscending.errors(1)); // '1 must be a array'
console.log(isAscending.errors(['a'])); // 'a must be a integer'
console.log(isAscending.errors([1, 2, 3])); // false
console.log(isAscending.errors([1, 2, 4])); // 'bad value <4>'
```

## `.eachWithDetail()` returns more data with the error about the item location and the array.

Sometimes you want the error message to know more about the location and the context of the error. In the above example, for instance you might want to provide insight into the previous value that failed. `.eachWithDetail()` provides that information. You will want to provide a custom error handler for this situation:

```javascript
const isAscending = trial()
  .eachWithDetail(['integer', (value, index, list) => {
    if (index === 0) return false;
    const prev = list[index - 1];

    return prev + 1 !== value;
  }], (value, [error, item, index, list]) => {
    if (/bad value/.test(error)) {
      return `${item} ([${index}]) is not one more than ${list[index - 1]}`;
    }
    return error;
  });

isAscending.errors(['a']);
console.log(isAscending.errors(1)); // '1 must be a array'
console.log(isAscending.errors(['a'])); // 'a must be a integer'
console.log(isAscending.errors([1, 2, 3])); // false
console.log(isAscending.errors([1, 2, 4])); // '4 ([2]) is not one more than 2'
```

## Optional values

If a value is optional you can use an identity/or pattern to short circuit tests for empty values:

```javascript

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

console.log(emailTest.errors('')); // ' is not a valid email');
console.log(emailTest.errors('foo')); //  'foo is not a valid email';
console.log(emailTest.errors(2)); //  '2 must be a string');
console.log(emailTest.errors('foo@bar.com')); // false;

console.log(optionalEmail.errors('')); //  false);
console.log(optionalEmail.errors('foo')); //  'foo is not a valid email';
console.log(optionalEmail.errors(2)); //  '2 must be a string';
console.log(optionalEmail.errors('a@b.com')); // , false;
```

## Default error messages

simple (single function) tests return generic error messages on failure: 'bad value <2>'.
Complex (eachWithIterator, and) trials return all the errors returned as an array.
