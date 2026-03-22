/* eslint-disable no-console */
const jwt = require('jsonwebtoken');

const secret = '27d09e133afe6539bd462ad36e27b203'; // master
// const secret = 'f220c1a051ec9e90def1e3a1d90df9b0'; //vc
// const secret = '3b64cc4666edda891361ef728d88852b'; //multizone

const token = jwt.sign({ role: 'ADMIN' }, secret, {
  algorithm: 'HS256',
});
// const token = jwt.sign({ tenant_id: 'volvecapital', role: 'BACKEND' }, secret, {
//   algorithm: 'HS256',
// });
// const token = jwt.sign({ tenant_id: 'multizone', role: 'BACKEND' }, secret, {
//   algorithm: 'HS256',
// });

console.log(token);
