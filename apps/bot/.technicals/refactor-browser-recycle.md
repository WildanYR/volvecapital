# Refactor Browser Recycle

## Current State

saat ini browser recycle dihandle oleh module dengan menerapkan aturan recycle browser context setiap 30 kali looping per module (untuk module yang punya executeLoop).

## Expected New State

browser recycle dihandle oleh task manager melalui scheduler, yaitu recycle setiap interval tertentu. interval ini nanti berada pada config file yang bisa diubah oleh user setiap berapa menit browser perlu di recycle. dan kondisi baru ini bukan untuk tiap module, tapi keseluruhan browser/ browser global yang di close kemudian dibuka lagi untuk lanjut menjalankan loop bagi module yang memiliki executeLoop.

ketika scheduler untuk recycle browser berjalan ada beberapa hal yang perlu diperhatikan:
1. stop fase loop untuk semua module instance, ini jelas, agar tidak terjadi error karena browser tidak ditemukan.
2. queue tetap ada, jangan menghapus task yang sudah masuk ke queue dan jangan block task yang mau dimasukkan ke queue misal ada task baru dari connector.
3. meskipun queue tetap berjalan tapi proses menjalankan task dihentikan dulu, biarkan task yang masih didalam queue tetap disitu sampai browser recycle selesai dan browser dibuka lagi baru kemudian menjalankan task yang ada didalam queue.
4. jangan close task yang saat itu sedang berjalan, tunggu sampai semua task berjalan diselesaikan dulu baru lakukan recycle browser.

## Catatan

scheduler untuk recycle browser ini sifatnya global jadi setelah semua komponen diinisiasi, daftarkan scheduler untuk recycle browser. dan nantinya scheduler global seperti ini akan dipakai juga selain untuk recycle browser, contohnya untuk delete data task yang umurnya lebih dari 1 hari agar ukuran db tidak membengkak karena task yang disimpan di db hanya dipakai untuk antisipasi jika terjadi crash pada app agar bisa melanjutkan ketika appnya di restart, setelah selesai dikerjakan maka task tidak perlu disimpan sebagai data.

untuk sekarang fokus dulu pada refactor recycle browsernya, scheduler global lain bukan sekarang.