import {trapDefinitions} from '../../src/_lib/vars';

export function clearTrapDefinitions() {
  Object.keys(trapDefinitions).forEach((trapDefinitionName) => {
    delete trapDefinitions[trapDefinitionName];
  });
}
