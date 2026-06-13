async function test() {
  const fetch = require('node-fetch');
  const response = await fetch('http://localhost:4000/labels?product_variant_id=1', {
    headers: {
      'authorization': 'VC ' + (await getSuperadminToken()),
      'x-tenant-id': 'paytronik'
    }
  });
  console.log('status', response.status);
  const text = await response.text();
  console.log('response', text);
}

async function getSuperadminToken() {
  const { Sequelize } = require('sequelize');
  const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', { dialect: 'postgres', logging: false });
  // fake token might not work if it checks jwt. Let's just login
  return "placeholder";
}
// wait, I can just query without token if it's disabled or we can just mock it.
// better yet, I can look at the backend source to see what it returns!
