# Rencana Implementasi Dashboard Statistik Lengkap

Berikut adalah rencana implementasi untuk fitur statistik dashboard baru dengan filter periode yang dinamis dan penambahan metrik `capital_price` serta Laba Kotor.

## 1. Arsitektur & Strategi Database (TimescaleDB / Agregasi)

Mengingat instruksi untuk membuatnya "lebih ringan" dan menggunakan struktur database yang ada, kita memiliki dua opsi pendekatan query:

**Pendekatan A: Mengandalkan Tabel Agregasi Saat Ini (Upsert Manual)**
Kita tetap menggunakan tabel `revenue_statistics`, `product_sales_statistics`, dll. Namun, karena ada kebutuhan metrik **Total Capital Price** dan **Laba Kotor**, kita perlu menambahkan kolom baru di tabel `revenue_statistics`.
- Tambahkan kolom `total_capital_price` di tabel `revenue_statistics`.
- Setiap ada transaksi, trigger/upsert akan menghitung `capital_price` dari akun yang terjual dan menambahkannya ke tabel agregasi.

**Pendekatan B: Menggunakan TimescaleDB (Hypertable & Continuous Aggregates)**
Jika Anda benar-benar ingin memanfaatkan kapabilitas TimescaleDB:
- Tabel `transaction` dan `transaction_item` diubah menjadi **Hypertable** (berdasarkan `created_at`).
- Tabel statistik (`revenue_statistics`, dll) digantikan oleh **Continuous Aggregates** (Materialized View) yang secara otomatis menghitung `total_revenue`, `total_capital_price`, dan `transaction_count` secara harian/bulanan di background. Ini jauh lebih ringan dan tidak perlu logika upsert manual di kode.

jawaban : saya mau pakai pendekatan B 

## 2. Struktur API Endpoint

Kita akan membuat endpoint API fleksibel yang menerima parameter periode:
`GET /api/dashboard/stats?filter={type}&date={date}&start_date={start}&end_date={end}`

**Tipe Filter (`type`):**
- `realtime`: Query data hari ini (live dari raw table).
- `today`: Sama dengan realtime.
- `yesterday`: Query data H-1.
- `last_7_days`: Rentang H-7 sampai hari ini.
- `last_30_days`: Rentang H-30 sampai hari ini.
- `custom_day`: Berdasarkan `date` spesifik.
- `custom_week`: Berdasarkan `start_date` dan `end_date` (rentang minggu).
- `custom_month`: Berdasarkan bulan tertentu.
- `custom_year`: Berdasarkan tahun tertentu.

**Response Payload API:**
```json
{
  "summary": {
    "total_revenue": 15000000,
    "total_capital_price": 5000000,
    "gross_profit": 10000000
  },
  "charts": {
    "revenue": [ { "label": "Senin", "value": 2000000 }, ... ],
    "peak_hour": [ { "hour": "20:00", "count": 45 }, ... ],
    "platform": [ { "name": "Shopee", "count": 120 }, ... ],
    "top_products": [ { "name": "Netflix 1 Bulan", "sold": 300 }, ... ]
  }
}
```

## 3. Implementasi Frontend (Dashboard UI)

1. **Komponen Filter Global:**
   Membuat dropdown `Select` untuk memilih mode filter (Hari Ini, Kemarin, 7 Hari, 30 Hari, dsb). Jika memilih "Per Hari", "Per Minggu", dll., akan memunculkan komponen `DatePicker` yang sesuai.
   
2. **Summary Cards (Card Ringkasan):**
   - Menghapus card lama (Penghasilan Hari ini & Bulan Ini).
   - Membuat 3 Card baru berjejer:
     - **Pendapatan Bersih** (Total Revenue)
     - **Modal Akun** (Total Capital Price)
     - **Laba Kotor** (Gross Profit)

3. **Charts (Grafik):**
   Setiap komponen grafik (Line Chart untuk Revenue, Bar Chart untuk Peak Hour & Produk Terlaris, Pie/Doughnut Chart untuk Platform) akan menerima `data` prop dari hasil fetch API yang sudah difilter. Sumbu X pada grafik Revenue akan dinamis (menampilkan jam jika filter 'Hari Ini', menampilkan nama hari/tanggal jika 'Minggu/Bulan', dan nama bulan jika 'Tahun').

---

## ❓ Pertanyaan Klarifikasi (Mohon dijawab sebelum ngoding)

1. **Konsep Laba Kotor & Modal (Capital Price):**
   Bagaimana cara menghitung total modal? Jika satu akun (misal modal Rp50.000) disewakan ke 4 user (4 profil), apakah beban modal untuk transaksi tersebut dibagi 4 (Rp12.500 per profil) atau dihitung utuh?
   *(Konteks: Saat transaksi terjadi, `transaction_item` me-link ke `account_user` -> `account`. Kita perlu tahu rumus pastinya agar Laba Kotor akurat).*

   jawaban : tidak perlu dibagi langsung jumlahkan aja data yang sudah aku isi di `capital_price` pada tabel `account_user`

2. **Perubahan Tabel Agregasi:**
   Apakah Anda setuju untuk menambahkan kolom `total_capital_price` ke tabel `revenue_statistics`? Ataukah kita akan murni query dari raw tabel `transaction` menggunakan TimescaleDB Hypertable?

   jawaban : sepertinya akan lebih mudah query dari raw tabel `transaction` menggunakan TimescaleDB Hypertable karena datanya kan gak terlalu besar juga per hari nya paling banyak transaksi 5000 an  

3. **Konversi ke TimescaleDB:**
   Saat ini dokumentasi menyebutkan tabel agregasi di-upsert secara manual. Jika ingin pakai TimescaleDB, apakah kita akan mengubah arsitekturnya memakai *Continuous Aggregates* bawaan Timescale, atau tetap pakai cara upsert manual yang ada (hanya istilahnya saja yang mirip time-series)?

   jawaban : ya setuju pakai continuous aggregates nya bawaan timescale

Silakan berikan feedback untuk pertanyaan di atas agar kita bisa mulai ke tahap implementasi kode (backend & frontend).
