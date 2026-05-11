# Implementasi Shopee Dual-Mode (Akun Langsung vs Auto-Voucher)

Dokumen ini menjelaskan cara mengatur bot agar bisa berjalan di dua jalur pengiriman yang berbeda melalui konfigurasi `config.toml`.

## 1. Pengaturan Jalur di `config.toml`
Kamu bisa menentukan jalur pengiriman secara fleksibel untuk setiap toko yang terdaftar di `[[modules]]`.

```toml
# CONTOH TOKO 1: Menggunakan Jalur Akun Langsung
[[modules]]
module = "shopee-order"
name = "paytronik"
delivery_mode = "account" # Bot akan mengirimkan Email & Password akun

# CONTOH TOKO 2: Menggunakan Jalur Voucher
[[modules]]
module = "shopee-order"
name = "digital_premium"
delivery_mode = "voucher" # Bot akan mengirimkan Kode Voucher & Link Redeem
```

## 2. Alur Logika di Dalam Kode (ShopeeOrderModule.ts)
Bot akan melakukan percabangan logika berdasarkan nilai `delivery_mode`:

```typescript
if (this.moduleConfig.delivery_mode === 'voucher') {
  /** 
   * JALUR VOUCHER
   * 1. Ambil nomor WA dari .buyer-contact-information
   * 2. Panggil API /voucher/generate
   * 3. Kirim pesan dengan format Template Voucher
   */
  const buyerWhatsapp = await extractWhatsapp(page);
  const voucher = await generateVoucherTransaction(...);
  const message = formatVoucherMessage(voucher, product);
  await sendMessage(message);

} else {
  /**
   * JALUR AKUN (DEFAULT)
   * 1. Panggil API /transaction
   * 2. Ambil detail akun (Email, Pass, Profil, PIN)
   * 3. Kirim pesan menggunakan copy_template produk
   */
  const accounts = await generateAccountTransaction(...);
  const message = formatAccountMessage(accounts);
  await sendMessage(message);
}
```

## 3. Ekstraksi Data Kontak (Khusus Jalur Voucher)
Bot akan lebih proaktif mengambil data pembeli jika dalam mode voucher untuk mengisi database pelanggan.

- **Selector:** `.buyer-contact-information`
- **Data:** Mengambil nomor WhatsApp (setelah tanda koma).

## 4. Template Pesan Jalur Voucher
Jika memilih jalur voucher, pesan akan otomatis menggunakan format standar dashboard:

```text
Terima kasih telah melakukan pembelian di toko kami. Berikut adalah detail voucher Anda:

Produk : $$product
Kode Voucher : $$voucher
Batas Klaim : $$batasklaim
Link redeem : $$namatenant.digitalpremium.id/redeem?code=$$voucher

Cara Redeem Voucher:
1. Klik link redeem di atas.
2. Kode voucher akan terisi otomatis.
3. Klik "Cek Sekarang", lalu klik "Aktivasi Voucher".
4. Jika berhasil, detail akun akan muncul seketika.
```

---

### **Kesimpulan:**
Dengan sistem ini, kamu punya kendali penuh. Jika stok akun sedang banyak, bisa pakai `delivery_mode = "account"`. Jika ingin lebih aman dan otomatis, cukup ganti ke `delivery_mode = "voucher"`.

Apakah draf jalur ganda ini sudah sesuai? Jika ya, saya akan langsung eksekusi kodingnya!
