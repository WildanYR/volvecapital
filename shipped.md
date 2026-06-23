


aku mau nambahin pengkondisian lagi nih, tadi kan ada unpaid,ready to ship, nah sekarang aku mau nambahin satu lagi yaitu shipped, yang punya kelas <span data-v-31452229="" class="el-tag el-tag--warning el-tag--light">
                        Shipped
                        <!----></span>


jika menemukan tag shipped, maka bot akan analisa lagi
pertama analisa jenis produk <div data-v-31452229="" class="order_item_buyer"><div data-v-31452229="" class="flex justify_between" style="align-items: flex-start;"><label data-v-31452229="" title="Buyer payment amount">Buyer payment amount</label> <span data-v-31452229="" class="flex direction_column align_end"><span data-v-31452229="" class="fw_700">8,610.00 IDR</span> <!----></span></div> <!----> <div data-v-31452229="" class="flex justify_between"><label data-v-31452229="" title="Payment Method">Payment Method</label> <span data-v-31452229="">
                Online Payment
            </span></div> <div data-v-31452229="" class="flex justify_between"><label data-v-31452229="" title="Payment Time">Payment Time</label> <span data-v-31452229="">2026/06/23 12:58</span></div> <!----></div>

jika harga yang tertera disitu (class="fw_700")
kurang dari 15000 berarti buyer order harian
jika harga antara 15001 - 30000 berarti order mingguan
jika harga antara 30001 - 45000 berarti order sharing bulanan
jika harga lebih dari 45001 berarti order bulanan private 

setelah teridentifikasi jenis orderan nya bot cek <div data-v-31452229="" class="order_item_time clr_gy">
            2026/06/23 12:58
            (UTC+07:00)
        </div>

contoh sudah teridentifikasi buyer order harian 
jika tanggal disitu sudah lewat dari 22 jam maka balas pesan 
Shipped_reply_habis_harian "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase harian, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 22-24 jam ya kak 🙏" || "Silahkan CO lagi kak atau ke W aja lebih murah cuma 5k 

klik ==> s.id/LangganandiWea  
kalo gabisa diklik copy aja lalu paste di browser web"

tanda || itu pemisah agar reply nya 2 baris seperti yang reguler 

jika belum terlewat 22 jam maka dibalas
Shipped_reply_harian "mohon ditunggu sebentar ya kak, pesanan akan segera diproses" 


contoh sudah teridentifikasi buyer order mingguan 
jika tanggal disitu sudah lewat dari 7 hari maka balas pesan 
Shipped_reply_habis_mingguan "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase mingguan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 7 hari ya kak 🙏" || "Silahkan CO lagi kak atau ke W aja lebih murah cuma 20k 

klik ==> s.id/LangganandiWea  
kalo gabisa diklik copy aja lalu paste di browser web"

tanda || itu pemisah agar reply nya 2 baris seperti yang reguler 

jika belum terlewat 7 hari maka dibalas
Shipped_reply_mingguan "mohon ditunggu sebentar ya kak, pesanan akan segera diproses" 


contoh sudah teridentifikasi buyer order sharing bulanan 
jika tanggal disitu sudah lewat dari 25 hari maka balas pesan 
Shipped_reply_habis_sharing_bulanan "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase bulanan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 25-30 hari ya kak 🙏" || "Silahkan CO lagi kak atau ke W aja lebih murah cuma 35k 

klik ==> s.id/LangganandiWea  
kalo gabisa diklik copy aja lalu paste di browser web"

tanda || itu pemisah agar reply nya 2 baris seperti yang reguler 

jika belum terlewat 25 hari maka dibalas
Shipped_reply_sharing_bulanan "mohon ditunggu sebentar ya kak, pesanan akan segera diproses" 

contoh sudah teridentifikasi buyer order bulanan 
jika tanggal disitu sudah lewat dari 25 hari maka balas pesan 
Shipped_reply_habis_bulanan "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase bulanan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 27-30 hari ya kak 🙏" || "Silahkan CO lagi kak atau ke W aja lebih murah cuma 50k 

klik ==> s.id/LangganandiWea  
kalo gabisa diklik copy aja lalu paste di browser web"

tanda || itu pemisah agar reply nya 2 baris seperti yang reguler 

jika belum terlewat 30 hari maka dibalas
Shipped_reply_bulanan "mohon ditunggu sebentar ya kak, pesanan akan segera diproses" 




