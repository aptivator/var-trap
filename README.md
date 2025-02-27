# `var-trap`

## Table of Contents

* [Introduction](#introduction)
* [Motivation](#motivation)
  * [Unsubscribing using `takeUntil()` and an unsubscriber observable](#unsubscribing-using-takeuntil-and-an-unsubscriber-observable)
  * [Unsubscribing using `var-trap`](#unsubscribing-using-var-trap)
* [Installation](#installation)
  * [Installing the Library](#installing-the-library)
  * [Distributed Versions](#distributed-versions)
* [Usage](#usage)
  * [Defining Trap Types](#defining-trap-types)
    * [storeFactory and valueAdder](#storefactory-and-valueadder)
    * [methods](#methods)
  * [Working with Trap Objects](#working-with-trap-objects)
    * [Creating Trap Objects](#creating-trap-objects)
    * [Sending Values to a Trap](#sending-values-to-a-trap)
    * [Retrieving a Collection of Trapped Values](#retrieving-a-collection-of-trapped-values)
    * [Invoking Methods on a Trap](#invoking-methods-on-a-trap)
    * [Invoking Methods on a Trap with Arguments](#invoking-methods-on-a-trap-with-arguments)
    * [Deleting a Trap](#deleting-a-trap)
    * [Adding a Trap to an Existing Trap Object](#adding-a-trap-to-an-existing-trap-object)
  * [Deleting a Trap Definition](#deleting-a-trap-definition)
  * [Examples](#examples)
* [Development](#development)
  * [Development Setup](#development-setup)
  * [Contributing Changes](#contributing-changes)

<a name="introduction"></a>
## Introduction

The utility creates an object with one or more trap properties.  The latter are
setters that store values passed to them via the equality (`=`) in a collection.
The collection can be retrieved at a later point and "worked" with.  A trap definition
specifies a type of collection that is to be instantiated for a trap property and how
a value passed via assignment is to be added to the aggregating data structure.  A trap
definition can also include methods that could be invoked on a trap property and receive
a respective collection plus optional parameters.  Each trapper property includes a `delete()`
method, an invocation of which will delete the trap from its object.

<a name="motivation"></a>
## Motivation

`var-trap` was originally written as an alternative to tracking `rxjs`
subscriptions and "releasing" them once a module's life cycle is completed.
One of the recommended generic mechanisms for unsubscribing from a single or
multiple observables is to call `pipe()` on each observable with `takeUntil()`
operator listening for the `complete()` call from the specifically instantiated
unsubscriber observable.  This following example illustrates the approach.

<a name="unsubscribing-using-takeuntil-and-an-unsubscriber-observable"></a>
### Unsubscribing using `takeUntil()` and an unsubscriber observable

```javascript
import {Subject}   from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'some',
  templateUrl: './some.component.html'
})
export class SomeComponent {
  unsubscribe$ = new Subject();
  
  constructor(private dataState$, private stream$) {}

  ngOnInit() {
    this.stream$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => console.log(data));
    this.dataState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state) => console.log(state));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
```

In terms of code maintainability, the above approach has an advantage over
storing subscriptions in variables and then disconnecting observables' listeners
by calling `unsubscribe()` directly on each subscription.  The disadvantage
of the `pipe()`-`takeUntil()` method is extra verbosity.  `var-trap` can be used
instead to capture and store multiple subscriptions and do so with a smaller
footprint as illustrated below.

<a name="unsubscribing-using-var-trap"></a>
### Unsubscribing using `var-trap`

Before a trap object with trapper properties can be used, an appropriate trap
definition must be imported or specified.

*some-angular-component-file.js*
```javascript
import {createTrapObject} from 'var-trap';

@Component({
  selector: 'some',
  templateUrl: './some.component.html'
})
export class SomeComponent {
  trap = createTrapObject({$: 'observable'});
  
  constructor(private dataState$, private stream$) {}

  ngOnInit() {
    this.trap.$ = this.stream$.subscribe((data) => console.log(data));
    this.trap.$ = this.dataState$.subscribe((state) => console.log(state));
  }

  ngOnDestroy() {
    this.trap.$.unsubscribe();
  }
}
```

For the above instance, the `var-trap` version is about 20 percent smaller.
Most application modules will be bigger than the examples and code "savings"
due to the use of the library will be smaller, especially if traps would have
to be locally defined.  Nonetheless, even across a large program and  using
traps will result in a noticeable decrease in verbosity.

<a name="installation"></a>
## Installation

<a name="installing-the-library"></a>
### Installing the Library

To fetch `var-trap`, run the following command:

```
npm install --save var-trap
```

<a name="distributed-versions"></a>
### Distributed Versions

The library's default import (from `var-trap`) is either an EcmaScript (ES) or a CommonJS
(as an UMD) module that bundles the source code without transpilation.  The library makes use
of proxies, latest native methods (e.g., `Object.hasOwn`), and data structures such as `Set`.
The defaults are provided as such with the expectations that `var-trap` will be included as a
dependency to a host project that, in turn, will be transpiled for some target environment
or used, as is, in a browser or server-side environment (e.g., Node 20+) that supports the
utilized language features.

For those rare circumstances when `var-trap` has to be utilized in older backend environments
or included in a larger bundle without transpilation (for older browsers), the EcmaScript 5
distributable is available from `var-trap\es5`.

<a name="usage"></a>
## Usage

<a name="defining-trap-types"></a>
### Defining Trap Types

<a name="storefactory-and-valueaddder"></a>
#### storeFactory and valueAdder

`storeFactory()` and `valueAdder()` functions are required for a trap
definition.  `storeFactory()` should return an instance of a collection.
`valueAdder()` receives a value and a collection and then adds the former
to the latter.

The library will error out if any one of these is not provided.

```javascript
import {addTrapDefinitions} from 'var-trap';

addTrapDefinitions('array', {
  storeFactory: () => [],
  valueAdder: (value, array) => array.push(value),
});
```
<a name="methods"></a>
#### methods

`methods` is a list of user-defined functions that, internally and by default,
receive a collection.  Each function receives an actual (not cloned) collection
created by `storeFactory()`;

```javascript
addTrapDefinitions('callbacks', {
  storeFactory: () => [],
  valueAdder: (callback, callbacks) => callbacks.push(callback),
  methods: {
    run(callbacks) {
      for(let callback of callbacks) {
        callback();
      }
    }
  }
});
```

A method, in addition to a collection, can also receive parameters.

```javascript
addTrapDefinitions('array', {
  storeFactory: () => [],
  valueAdder: (value, array) => array.push(value),
  methods: {
    print(array, asString) {
      if(asString) {
        array = array.join(', ');
      }

      console.log(array);
    }
  }
});
```

By default, all of the `methods` are chainable.  If a definition includes
methods `sum()`, `print()`, and `clear()`, then they can be called one
after another: `trap.a.sum().print().clear()`.

`var-trap` does allow specifying methods that will return their value instead
of an instance from which they are called.

```javascript
addTrapDefinitions('numbers', {
  storeFactory: () => [],
  valueAdder: (number, numbers) => numbers.push(number),
  methods: {
    sum: {
      method(numbers) {
        return numbers.reduce((sum, number) => {
          return sum + number;
        });
      },
      configs: {returnValue: true}
    }
  }
});
```

<a name="working-with-trap-objects"></a>
### Working with Trap Objects

<a name="creating-trap-objects"></a>
#### Creating Trap Objects

All of the necessary trap definitions must be declared before a trap object
relying on these definitions can be created.  Because of a wide variety of
circumstances in which trap objects can be used, at this time, no default
trap pattern definitions are included with the library.

*trap-definitions.js*
```javascript
import {addTrapDefinitions} from 'var-trap';

addTrapDefinitions({
  callbacks: {
    storeFactory: () => new Set(),
    valueAdder: (callback, callbacks) => callbacks.add(callback),
    methods: {
      clear(callbacks) {
        callbacks.clear()
      },
      run(callbacks) {
        callbacks.forEach((callback) => callback());
      }
    }
  },
  array: {
    storeFactory: () => [],
    valueAdder: (value, array) => array.push(value),
    methods: {
      print(array, asString) {
        if(asString) {
          array = array.join(', ');
        }

        console.log(array);
      }
    }
  }
});
```

To create a trap object, import `createTrapObject()` and provide it an
object of trap property/trap definition name pairs.

*file-that-uses-trap-objects.js*
```javascript
import {createTrapObject} from 'var-trap';

let trap = createTrapObject({a: 'array', c: 'callbacks'});
```

A trap object can be created as is for the purpose of traps being added later.

*trap-objects.js*
```javascript
import {createTrapObject} from 'var-trap';

export const trap = createTrapObject();
```

*trap-creating-file.js*
```javascript
import {trap} from './trap-objects';

trap.addTraps({a: 'array'});
```

<a name="sending-values-to-a-trap"></a>
#### Sending Values to a Trap

For each trap property, `var-trap` creates a setter that uses `valueAdder()`
to store a value received via assignment (ie., `=`) inside a collection.

```javascript
import {createTrapObject} from 'var-trap';
import {process1}         from './process1';
import {process2}         from './process2';
import {process3}         from './process3';

let trap = createTrapObject({c: 'callbacks'});

trap.c = process1.subscribe(() => {});
trap.c = process2.subscribe(() => {});
trap.c = process3.subscribe(() => {});
```

<a name="retrieving-a-collection-of-trapped-values"></a>
#### Retrieving a Collection of Trapped Values

For each trap property, `var-trap` creates a getter that returns an
internally created instance that combines a collection that stores
values with declared methods that can operate on the collection.  Within
the instance a collection can be accessed via `store`.

```javascript
let trap = createTrapObject({a: 'array'});

trap.a = 1;
trap.a = 2;
trap.a = 3;

console.log(trap.a.store); // [1, 2, 3]
```

<a name="invoking-methods-on-a-trap"></a>
#### Invoking Methods on a Trap

Operating on the gathered values can be done directly.

```javascript
let trap = createTrapObject({c: 'callbacks'});

trap.c = process1.subscribe(() => {});
trap.c = process2.subscribe(() => {});
trap.c = process3.subscribe(() => {});

trap.c.store.forEach((unsubscribe) => unsubscribe());
trap.c.store.clear();
```

The above example is appropriate for relatively rare situations.  Procedures
that are commonly applied to captured values could be abstracted as a part
of a trap definition.

```javascript
let trap = createTrapObject({c: 'callbacks'});

trap.c = process1.subscribe(() => {});
trap.c = process2.subscribe(() => {});
trap.c = process3.subscribe(() => {});

this.c.run().clear();
```

<a name="invoking-methods-on-a-trap-with-arguments"></a>
#### Invoking Methods on a Trap with Arguments

In the above `array` trap definition the `print()` method takes an optional
`asString` argument.  Just this parameter should be passed to the function to
trigger the appropriate functionality.

```javascript
let trap = createTrapObject({a: 'array'});

trap.a = 1;
trap.a = 2;

trap.a.print();     // [1, 2]
trap.a.print(true); // 1, 2
```

<a name="deletinga-a-trap"></a>
#### Deleting a Trap

A trap can be removed using the `delete` operator or the trap's 
default `delete()` method.  The advantage of using the method is
an option of executing `delete()` at the end of a methods chain.

```javascript
let trap = createTrapObject({c: 'callbacks'});

trap.c = process1.subscribe(() => {});
trap.c = process2.subscribe(() => {});

delete trap.c;  // same as trap.c.delete()
```

```javascript
let trap = createTrapObject({c: 'callbacks'});

trap.c = process1.subscribe(() => {});
trap.c = process2.subscribe(() => {});

trap.c.run().clear().delete();
```

<a name="adding-a-trap-to-an-existing-trap-object"></a>
#### Adding a Trap to an Existing Trap Object

Trap object comes with `addTraps()` method that is used internally by
`createTrapObject`.  `addTraps()` can be used after trap object
instantiation to add extra trap properties.

```javascript
let trap = createTrapObject({a: 'array'});

trap.addTraps({c: 'callbacks'});
```

<a name="deleting-a-trap-definition"></a>
### Deleting a Trap Definition

The library makes available `deleteTrapDefinitions` for those rare cases
when a trap definition needs to be removed.

```javascript
let {deleteTrapDefinitions} from 'var-trap';

deleteTrapDefinitions('array', 'callbacks');
```

<a name="examples"></a>
### Examples

[easy-data-state](https://github.com/aptivator/easy-data-state) uses `var-trap`
in one of its testing sections to scoop up unsubscription functions from
`subscribe()` calls and then execute and clear the unsubscriptions at the end
of each test.  Here is that testing [file](https://github.com/aptivator/easy-data-state/blob/master/test/functionality/subscribe.test.js).  Use of `var-trap` reduced the amount of
the testing code from 202 to 178 lines (about 12 percent).

[promise-keeper](https://github.com/aptivator/promise-keeper) uses `var-trap`
also in one of its testing sections to capture instantiated promises without
having to assign these to variables.  Here is that [example](https://github.com/aptivator/promise-keeper/blob/master/test/static-methods.test.js).

<a name="development"></a>
## Development 

<a name="development-setup"></a>
### Development Setup 

Perform the following steps to setup the repository locally.

```
git clone https://github.com/aptivator/var-trap.git
cd var-trap
npm install
```

To start development mode run `npm run dev` or `npm run dev:coverage`.

<a name="contributing-changes"></a>
### Contributing Changes

The general recommendations for contributions are to use the latest JavaScript
features, have tests with complete code coverage, and include documentation.
The latter may be necessary only if a new feature is added or an existing documented
feature is modified.
