import {libraryName} from './vars';

export function difference(arr1, arr2) {
  return arr1.filter((value) => !arr2.includes(value));
}

export function error(message) {
  throw new Error(`${libraryName}: ${message}`);
}

export function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
