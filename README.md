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

## The Building Blocks

`trial(test, errorFilter?)` returns an Inspector instance. Inspectors contain a test *or an array of tests* that are executed over a value when the inspectors' `error(value)` method. 

Optionally you can define an error filter - a function `(value, error) => ... :string` or a string template. String templates replace the tokens '%value%' with the input value. 

### Some important principles

#### "False is the new true"

In trial, "false is the new true"; false(y) means a test value has passed (none of the tests have failed)
the expected test, but non-falsy value indicates a failure, explained by the result.

### Inspectors can be passed as tests of other inspectors

As shown in the first examples, Inspectors -- or arrays of inspectors --- can be passed to the trial factory,
or any of an inspectors' currying methods -- `and(test)`, `or(test)`, and `each(test)`. This is how you can create large
branching complex tests. 

#### "and inspectors (the default) stop testing if they find an error"

so,

```javascript

const isBob = trial('string')
.and(trial((a) => !/^Bob/.test(a), 'not Bob'));

```

the regex is safe because if the first test fails, the second test is omitted. 

### "or inspectors stop testing once they don't find an error"

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

### each (iterators) 

as a shortcut, if you want to test every element of an arrray. you can call the `.each(test)` 
on the trial result, and the input will be automatically validated for array-ness, and 
the value will only succeed if each element in the array passes the test that is the argument for the 
`.each(test)` method. See the first example for array testing.  

## Optional values

If a value is optional you can use an identity/or pattern to short circuit tests for empty values:

```javascript

const optionalEmail = trial((a) => !!a)
.or (trial(['string', (s) => !/[\w+]@[\w]+\.[\w]+/.test(s)], '%value% is not a valid email'));

console.log(optionalEmail.errors('')); // false
console.log(optionalEmail.errors('foo')); // 'foo is not a valid email';
console.log(optionalEmail.errors('a@b.com')) // false

```

## Default error messages

simple (single function) tests return generic error messages on failure: 'bad value <2>'.
Complex (each, and) trials return all the errors returned as an array.
