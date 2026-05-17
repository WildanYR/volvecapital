# Rencana Implementasi WhatsApp Follow Up

Dokumen ini menjelaskan cara menambahkan tombol "Follow Up" di dashboard untuk mengirim pesan WhatsApp otomatis kepada pembeli menggunakan template yang sudah dikonfigurasi.

## 1. Lokasi Modifikasi
File: `apps/dashboard/src/routes/dashboard/voucher-generator/index.tsx`

## 2. Logika Parsing Template
Kita akan menggunakan logika yang mirip dengan fungsi `handleCopy` yang sudah ada, namun alih-alih menyalin ke clipboard, kita akan memprosesnya menjadi URL WhatsApp.

### Data yang Diperlukan:
- `$$product`: Nama Produk + Varian
- `$$voucher`: Kode Voucher (ID)
- `$$batasklaim`: Tanggal Kadaluarsa (Format ID)
- `$$linkredeem`: URL otomatis ke halaman redeem tenant

## 3. Implementasi Fungsi Helper
Fungsi ini akan memproses template dan membuka window baru ke WhatsApp:

```typescript
const handleFollowUpWA = (voucher: any) => {
  if (!voucher || !voucher.buyer_whatsapp) {
    toast.error('Nomor WhatsApp tidak ditemukan');
    return;
  }

  // 1. Ambil Nama Produk
  let productName = `${voucher.product_variant?.product?.name || ''} - ${voucher.product_variant?.name || ''}`.trim();
  
  // 2. Ambil Data Lainnya
  const voucherCode = voucher.id;
  const expiryDate = formatDate(voucher.expired_at);
  const linkRedeem = getLinkRedeem(voucherCode);

  // 3. Parse Template (Gunakan copyTemplate dari state)
  const message = copyTemplate
    .replace(/\$\$product/g, productName)
    .replace(/\$\$voucher/g, voucherCode)
    .replace(/\$\$batasklaim/g, expiryDate)
    .replace(/\$\$linkredeem/g, linkRedeem);

  // 4. Encode & Buka WhatsApp
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${voucher.buyer_whatsapp}?text=${encodedMessage}`;
  
  window.open(waUrl, '_blank');
};
```

## 4. Perubahan UI (User Interface)
Tombol akan diletakkan di dalam popup **Detail Voucher**, tepat di samping informasi WhatsApp pembeli.

### Lokasi Baris (Sekitar Baris 790):
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-background border border-border">
      <Phone className="size-4 text-primary" />
    </div>
    <div>
      <p className="text-[10px] text-muted-foreground font-bold uppercase">WhatsApp</p>
      <p className="text-sm font-bold">{v.buyer_whatsapp}</p>
    </div>
  </div>
  {/* TOMBOL FOLLOW UP BARU */}
  <Button 
    size="sm" 
    variant="outline" 
    className="h-8 gap-2 text-xs border-green-500/50 text-green-600 hover:bg-green-50 hover:text-green-700"
    onClick={() => handleFollowUpWA(v)}
  >
    <Phone className="size-3" />
    Follow Up
  </Button>
</div>
```

## 5. Keunggulan Implementasi Ini:
- **Otomatis**: Admin tidak perlu mengetik detail voucher manual.
- **Konsisten**: Isi pesan akan selalu mengikuti template instruksi yang Anda set di dashboard.
- **Support Multi-line**: Penggunaan `encodeURIComponent` memastikan baris baru (enter) dan spasi muncul dengan benar di aplikasi WhatsApp pembeli.
