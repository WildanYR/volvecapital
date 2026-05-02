# Refactor Scheduler

saat ini scheduler cara bekerjanya adalah menggunakan cron dengan library node-cron. sebenarnya untuk use case aplikasi ini aku tidak terlalu membutuhkan penggunaan cron, jadi untuk efisiensi aku memikirkan untuk refactor bagian scheduler.

pertama di app ini sudah terintegrasi dengan database sqlite, nah aku ingin implementasi scheduler ini pakai sqlite saja, dan berikut konsep yang aku buat:

tujuan dari scheduler dibuat diapp ini adalah untuk menjalankan task pada waktu tertentu, dan ini artinya task tersebut akan dijalankan dibawah task manager. di database dalam core sudah ada sys_tasks, dengan adanya tabel ini aku bisa menyimpan data kapan task akan dieksekusi.

jadi nanti akan ada interval yang mengecek tabel task yang belum dieksekusi dengan syarat execute time nya < now(), jika ada maka task akan dieksekusi. dan ini sebenarnya sudah cukup untuk menjalankan scheduled task karena filternya berdasarkan kapan task tersebut dieksekusi. sehingga untuk task baru yang masuk tidak perlu lagi menggunakan cron expression, melainkan langsung menentukan kapan task tersebut akan dieksekusi.

di task manager pun hal tersebut sudah dihandle dengan processInterval, hanya tinggal menambahkan logic pengecekan task yang di database.

sumber input task yang akan diproses kan ada yang dari module instance dan dari connector eksternal, ketika mereka masukkan task maka mereka tinggal masukin datanya ke database, dan task manager akan memprosesnya sesuai dengan waktu yang ditentukan secara paralel dengan maksimal task yang bisa dikerjakan bersamaan sesuai config file.