import b from './b.js';
console.log('a starting');
console.log(b());
var tt = 1
export default function () {
  console.log(tt);
  return 'run func A';
}
console.log('a done');