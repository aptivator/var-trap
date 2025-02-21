import {expect}                                    from 'chai';
import {trapDefinitions}                           from '../src/_lib/vars';
import {addTrapDefinitions, deleteTrapDefinitions} from '../src/var-trap';

describe('deleteTrapDefinitions()', () => {
  describe('assertions', () => {
    it('errors if a trap definition does not exist', () => {
      let trapDefinitionName = 'none';
      let error = `trap definition '${trapDefinitionName}' does not exist and cannot be deleted`;
      expect(() => deleteTrapDefinitions(trapDefinitionName)).to.throw(error);
    });
  });

  describe('trap definition deletion', () => {
    it('removes trap definitions', () => {
      let definitions = {
        one: {storeFactory() {}, valueAdder() {}}, 
        two: {storeFactory() {}, valueAdder() {}}
      };
  
      addTrapDefinitions(definitions);
      expect(Object.keys(trapDefinitions).sort()).to.eql(Object.keys(definitions).sort());
      deleteTrapDefinitions(...Object.keys(definitions));
      expect(trapDefinitions).to.eql({});
    });
  });
});
