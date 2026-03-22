# API and Auth

perlu dipahami bahwa aplikasi Volve Capital Bot adalah perpanjangan tangan dari aplikasi Volve Capital yang ada di server. dan server Volve Capital bukanlah open API yang bisa diakses bebas, dia hanya menerima akses oleh authorized user, yaitu user yang melakukan authentikasi kemudian mendapatkan access token untuk mengakses API tersebut.

oleh karena itu diperlukan mekanisme untuk melakukan authentikasi ke server saat pertama kali Volve Capital Bot dijalankan, dan berikut flow authnya:

## 1. Baca Config File

perlu ada config baru pada kategori api yang berisi appId dan appSecret. saat ini konfigurasi tersebut belum dibuat.

saat initial run, Volve Capital Bot membaca konfigurasi tersebut untuk melakukan authentikasi ke server.

## 2. Dapatkan Access Token

setelah mendapatkan appId dan appSecret, lakukan fetch ke api untuk authentikasi, di bawah ini aku sertakan kode dari app yang sudah berjalan untuk authnya:

```typescript
export async function fetchAccessToken(appId: string, secret: string) {
  const url = `${API_BASE_URL}/tenant/access-token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: appId, secret }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new FetchFailedError(`Gagal mendapatkan access token: ${data.message}`);
  }
  const data = await res.json();

  return { id: data.id, token: data.token };
}
```

setelah mendapatkan id dan token, simpan data ini di db (sys_kv_store) karena ini akan digunakan untuk semua fetch ke API.

## 3. Rule Fetch ke API

selanjutnya ketika app dijalankan lagi maka lakukan pengecekan ke db apakah sudah ada id dan tokennya, kalo sudah ada tidak perlu authentikasi lagi, authentikasi ke API hanya dilakukan kalo belum ada id dan token.

kemudian setiap fetch ke API maka dia perlu mencantumkan data di header sebagai berikut (termasuk saat koneksi awal ke websocket):

```json
{
  "Content-Type": "application/json",
  "Authorization": "VC {token yang didapat dari auth}",
  "x-tenant-id": "{id yang didapat dari auth}"
}
```