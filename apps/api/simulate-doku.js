const invoice = process.argv[2];

if (!invoice) {
  console.log("❌ Penggunaan salah!");
  console.log("Cara pakai: node simulate-doku.js <NOMOR_INVOICE>");
  console.log("Contoh: node simulate-doku.js INV-PAYTRONIK-1784191533567");
  process.exit(1);
}

console.log(`Mensimulasikan pembayaran SUKSES untuk invoice: ${invoice}...`);

fetch('http://localhost:4000/public/payment/notify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order: {
      invoice_number: invoice,
      amount: 10000 // Amount tidak dicek ketat di endpoint ini
    },
    transaction: {
      status: 'SUCCESS'
    }
  })
})
  .then(res => res.text())
  .then(data => {
    console.log("✅ Berhasil mengirim notifikasi DOKU palsu (Mock Webhook)!");
    console.log("Response dari API:", data);
  })
  .catch(err => {
    console.error("❌ Gagal menghubungi API:", err);
  });
