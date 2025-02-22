import {expect}                               from 'chai';
import {trapReservedKeywords}                 from '../src/_lib/vars';
import {addTrapDefinitions, createTrapObject} from '../src/var-trap';
import {clearTrapDefinitions}                 from './_lib/utils';

describe('createTrapObject()', () => {
  afterEach(clearTrapDefinitions);

  describe('assertions', () => {
    it('takes an object of trap name/trap definition name pairs', () => {
      let error = `trap(s) specification should be an object of trap name and trap definition name pairs`;
      let funcs = [
        () => createTrapObject('not-object'),
        () => {
          let trap = createTrapObject();
          trap.addTraps('not-object')
        }
      ];

      for(let func of funcs) {
        expect(func).to.throw(error);
      }
    });

    it('alerts if a trap name is a reserved keyword', () => {
      trapReservedKeywords.forEach((reservedTrapKeyWord) => {
        let trapConfigs = {[reservedTrapKeyWord]: 'none'};
        let error = `'${reservedTrapKeyWord}' trap name is a reserved keyword`;
        expect(() => createTrapObject(trapConfigs)).to.throw(error);
      });
    });

    it('throws if a trap definition does not exist', () => {
      let trapDefinitionName = 'none';
      let error = `definition for '${trapDefinitionName}' trap does not exist`;
      expect(() => createTrapObject({a: trapDefinitionName})).to.throw(error);
    });

    it('errors if a trap name already exists', () => {
      let trapName = 'a';
      let error = `'${trapName}' trap name already exists`;
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      let trapConfigs = {[trapName]: trapDefinitionName};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject(trapConfigs);
      expect(() => trap.addTraps(trapConfigs)).to.throw(error);
    });

    it('terminates when one of the trap reserved properties is attempted to be deleted', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);

      trapReservedKeywords.forEach((reservedTrapKeyword) => {
        let trapName = 'a';
        let error = `'${reservedTrapKeyword}' is a reserved trap property and cannot be deleted`;
        let trapConfigs = {[trapName]: trapDefinitionName};
        let trap = createTrapObject(trapConfigs);
        expect(() => delete trap[reservedTrapKeyword]).to.throw(error);
      });
    });
  });

  describe('trap objects', () => {
    it('makes a trap object with defined trap names', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName, b: trapDefinitionName});
      expect(Object.hasOwn(trap, 'a')).to.be.true;
      expect(Object.hasOwn(trap, 'b')).to.be.true;
    });

    it('creates a methods class instance that can be accessed via a trap name', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName});
      expect(trap.a).to.be.an.instanceof(trapDefinition.MethodsClass);
    });

    it('adds delete() method to a methods class instance', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName});
      expect(trap.a.delete).to.be.a('function');
    });

    it('includes trap definition methods on the methods class prototype', () => {
      let trapDefinitionName = 'name';
      let methods = {one() {}, two() {}};
      let trapDefinition = {storeFactory() {}, valueAdder() {}, methods};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName});
      expect(Object.keys(trap.a.__proto__).sort()).to.eql(Object.keys(methods).sort());
    });

    it('automatically passes a store to trap definition methods', () => {
      let trapDefinitionName = 'array';
      let methods = {
        clear(store) {
          store.slice(0);
        },
        add1(store) {
          store.forEach((value, index, store) => {
            store[index] = value + 1;
          });
        }
      };
      let trapDefinition = {
        storeFactory: () => [], 
        valueAdder: (value, store) => store.push(value), 
        methods
      };
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: 'array'});
      trap.a = 1;
      trap.a = 1;
      trap.a.add1();
      expect(trap.a.store).to.eql([2, 2]);
    });

    it('can pass optional arguments to trap definition methods', () => {
      let trapDefinitionName = 'array';
      let methods = {
        clear(store) {
          store.slice(0);
        },
        add(store, addition) {
          store.forEach((value, index, store) => {
            store[index] = value + addition;
          });
        }
      };
      let trapDefinition = {
        storeFactory: () => [], 
        valueAdder: (value, store) => store.push(value), 
        methods
      };
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: 'array'});
      trap.a = 1;
      trap.a = 1;
      trap.a.add(20);
      expect(trap.a.store).to.eql([21, 21]);
    });

    it('deletes trap properties via delete operator', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory: () => [], valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName});
      expect(Object.hasOwn(trap, 'a')).to.be.true;
      delete trap.a;
      expect(Object.hasOwn(trap, 'a')).to.be.false;
    });

    it('deletes trap properties via delete() method', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory: () => [], valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let trap = createTrapObject({a: trapDefinitionName});
      expect(Object.hasOwn(trap, 'a')).to.be.true;
      trap.a.delete();
      expect(Object.hasOwn(trap, 'a')).to.be.false;
    });
  });
});
