async function test() {
  try {
    const response = await fetch('http://localhost:4000/labels?product_variant_id=1', {
      headers: {
        'x-tenant-id': 'paytronik',
        'authorization': 'VC test'
      }
    });
    console.log('status', response.status);
    const text = await response.text();
    console.log('body', text);
  } catch (err) {
    console.error('error', err.message);
  }
}
test();
