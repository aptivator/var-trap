import {difference, error, isObject}                  from './_lib/utils';
import {trapReservedKeywords, trapDefinitionRequired} from './_lib/vars';
import {trapReservedMethods, trapDefinitions}         from './_lib/vars';

export function addTrapDefinitions(...params) {
  let trapDefinitionsNormalized = normalizeTrapDefinitions(params);
  trapDefinitionsNormalized = Object.entries(trapDefinitionsNormalized);

  trapDefinitionsNormalized.forEach(([trapDefinitionName, trapDefinition]) => {
    let {methods} = trapDefinition;
    let properties = Object.keys(trapDefinition);
    let missingRequired = difference(trapDefinitionRequired, properties);
    
    if(missingRequired.length) {
      missingRequired = missingRequired.join(', ');
      error(`provide the following trap definition properties: ${missingRequired}`);
    }
    
    if(trapDefinitions[trapDefinitionName]) {
      error(`trap definition '${trapDefinitionName}' already exists`);
    }
    
    class MethodsClass {
      constructor(store) {
        Object.assign(this, {store});
      }
    }

    if(methods) {
      Object.entries(methods).forEach(([methodName, method]) => {
        if(!trapReservedMethods.has(methodName)) {
          let configs = {};
          let {prototype} = MethodsClass;
  
          if(isObject(method)) {
            ({method, configs} = method);
          }
  
          if(configs.returnValue) {
            var func = function(...args) {
              return method(this.store, ...args);
            };
          } else {
            func = function(...args) {
              method(this.store, ...args);
              return this;
            };
          }
          
          return prototype[methodName] = func;
        }

        error(`'${methodName}' method name is reserved`);
      });
    }

    trapDefinitions[trapDefinitionName] = Object.assign(trapDefinition, {MethodsClass});
  });
}

function getTrapDefinition(trap, trapName, trapConfigs) {
  let trapDefinitionName = trapConfigs[trapName];
  let trapDefinition = trapDefinitions[trapDefinitionName];

  if(trapReservedKeywords.has(trapName)) {
    error(`'${trapName}' trap name is a reserved keyword`);
  }

  if(!trapDefinition) {
    error(`definition for '${trapDefinitionName}' trap does not exist`);
  }

  if(Object.hasOwn(trap, trapName)) {
    error(`'${trapName}' trap name already exists`);
  }

  return trapDefinition;
}

export function createTrapObject(trapConfigs) {
  let trap = {
    addTraps(trapConfigs) {
      if(isObject(trapConfigs)) {
        let trapNames = Object.getOwnPropertyNames(trapConfigs);
      
        return trapNames.forEach((trapName) => {
          let trapDefinition = getTrapDefinition(trap, trapName, trapConfigs);      
          let {MethodsClass} = trapDefinition;
          let {storeFactory, valueAdder} = trapDefinition;
          let store = storeFactory();
          let methodsInstance = new MethodsClass(store);
  
          methodsInstance.delete = function() {
            delete trap[trapName];
          }
          
          Object.defineProperty(trap, trapName, {
            get: () => methodsInstance,
            set: (value) => valueAdder(value, store),
            configurable: true
          });
        });
      }

      error(`trap(s) specification should be an object of trap name and trap definition name pairs`);
    }
  };
  
  if(trapConfigs) {
    trap.addTraps(trapConfigs);
  }

  return new Proxy(trap, {
    deleteProperty(trap, trapName) {
      if(trapReservedKeywords.has(trapName)) {
        error(`'${trapName}' is a reserved trap property and cannot be deleted`);
      }
    
      if(Object.hasOwn(trap, trapName)) {
        trap[trapName].delete();
      }

      return true;
    }
  });
}

export function deleteTrapDefinitions(...trapDefinitionNames) {
  for(let trapDefinitionName of trapDefinitionNames) {
    if(!Object.hasOwn(trapDefinitions, trapDefinitionName)) {
      error(`trap definition '${trapDefinitionName}' does not exist and cannot be deleted`);
    }

    delete trapDefinitions[trapDefinitionName];
  }

  return true;
}

function normalizeTrapDefinitions([trapDefinitionName, trapDefinition]) {
  if(!isObject(trapDefinitionName)) {
    trapDefinitionName = {[trapDefinitionName]: trapDefinition};
  }

  return trapDefinitionName;
}
