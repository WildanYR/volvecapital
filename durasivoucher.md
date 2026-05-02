Selesai! Cron job otomatis sudah saya aktifkan.

Berikut adalah detail teknisnya:

Mekanisme Otomatis: Saya menambahkan fungsi autoExpireVouchers di API yang akan berjalan setiap 15 menit sekali.
Cara Kerja: Script akan memindai seluruh tenant, mencari voucher yang statusnya masih UNUSED tetapi waktu expired_at-nya sudah terlewat, lalu otomatis mengubah statusnya menjadi EXPIRED.
Masa Berlaku Voucher:
Voucher Manual (dari Dashboard): Bertahan selama 7 hari.
Voucher Otomatis (dari Pembayaran): Bertahan selama 24 jam.
Sekarang angka statistik "Total Kadaluarsa" dan filter "Expired" akan selalu sinkron secara otomatis. Anda tidak perlu lagi melakukan pengecekan manual.

Ada lagi yang bisa saya bantu untuk optimasi sistem ini?