import {expect}                               from 'chai';
import {libraryName, trapDefinitionRequired}  from '../src/_lib/vars';
import {trapDefinitions, trapReservedMethods} from '../src/_lib/vars';
import {addTrapDefinitions, createTrapObject} from '../src/var-trap';
import {clearTrapDefinitions}                 from './_lib/utils';

describe('addTrapDefinitions()', () => {
  afterEach(clearTrapDefinitions);

  describe('assertions', () => {
    it('expects storeFactory() and valueAdder() methods', () => {
      let missingRequired = trapDefinitionRequired.join(', ');
      let errorMessage = `provide the following trap definition properties: ${missingRequired}`;
      let error = `${libraryName}: ${errorMessage}`;
      expect(() => addTrapDefinitions('definition', {})).to.throw(error);
    });

    it('errors if trap definition name already exists', () => {
      let trapDefinitionName = 'name';
      let error = `trap definition '${trapDefinitionName}' already exists`;
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      expect(() => addTrapDefinitions(trapDefinitionName, trapDefinition)).to.throw(error);
    });

    it('aborts if one of the methods names is reserved', () => {
      trapReservedMethods.forEach((reservedMethod) => {
        let trapDefinitionName = 'name';
        let trapDefinition = {storeFactory() {}, valueAdder() {}, methods: {[reservedMethod]() {}}};
        let error = `'${reservedMethod}' method name is reserved`;
        expect(() => addTrapDefinitions(trapDefinitionName, trapDefinition)).to.throw(error);
      });
    });
  });

  describe('trap definitions', () => {
    it('accepts one trap definition', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      expect(trapDefinitions[trapDefinitionName]).to.be.an('object');
    });

    it('takes multiple trap definitions as an object', () => {
      let definitions = {
        one: {storeFactory() {}, valueAdder() {}},
        two: {storeFactory() {}, valueAdder() {}}
      };
      addTrapDefinitions(definitions);
      expect(Object.keys(trapDefinitions).sort()).to.eql(Object.keys(definitions).sort());
    });

    it('creates a "blank" methods class', () => {
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let {MethodsClass} = trapDefinitions[trapDefinitionName];
      expect(Object.keys(MethodsClass.prototype).length).to.equal(0);
    });

    it('adds declared methods to a methods class prototype', () => {
      let methods = {one() {}, two() {}};
      let trapDefinitionName = 'name';
      let trapDefinition = {storeFactory() {}, valueAdder() {}, methods};
      addTrapDefinitions(trapDefinitionName, trapDefinition);
      let {MethodsClass} = trapDefinitions[trapDefinitionName];
      expect(Object.keys(MethodsClass.prototype).sort()).to.eql(Object.keys(methods).sort());
    });

    it('allows trap definition methods to be chainable or to return a value', () => {
      let trapDefinitionName = 'array';
      let methods = {
        add(store, addition) {
          store.forEach((value, index, store) => {
            store[index] = value + addition;
          });
        },
        sum: {
          method(store, asString) {
            let result = store.reduce((sum, value) => sum + value);

            if(asString) {
              result += '';
            }

            return result;
          },
          configs: {
            returnValue: true
          }
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
      trap.a = 2;
      expect(trap.a.add(1).sum()).to.equal(5);
      expect(trap.a.sum(true)).to.equal('5');
    });
  });
});
