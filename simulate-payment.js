const http = require('http');

const invoiceNumber = process.argv[2];

if (!invoiceNumber) {
    console.error('Cara penggunaan: node simulate-payment.js <INVOICE_NUMBER>');
    console.error('Contoh: node simulate-payment.js VC-digitalpremium-171829392');
    process.exit(1);
}

const payload = JSON.stringify({
    order: { invoice_number: invoiceNumber },
    transaction: { status: 'SUCCESS' }
});

const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/public/payment/notify', // menyesuaikan prefix nestjs
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    // Coba path tanpa prefix v1
    console.log('Mencoba path /api/public/payment/notify ...');
    const req2 = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/api/public/payment/notify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    }, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
            console.log('Status Code:', res2.statusCode);
            console.log('Response:', data2);
        });
    });
    
    req2.on('error', (e2) => {
        console.error('Error:', e2.message);
    });
    
    req2.write(payload);
    req2.end();
});

req.write(payload);
req.end();
