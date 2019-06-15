import a from './a.js';
console.log('b starting');
console.log(a());
export default function () {
  return 'run func B';
}
console.log('b done');