saat ini kan untuk membuat tenant harus lewat .env terus nambahin database dll ini menurutku sangat ribet, saya mau agar bisa register tenant

jadi kita kalo mau login dashboard saat ini kan http://localhost:3000/login 

nah saya mau untuk nambahin tenant nanti lewat http://localhost:3000/register-tenant

jadi user nanti bisa register tenant sendiri
dan login menggunakan password dan email yang sudah di daftarkan
dengan begitu tidak perlu lagi membuat tenant lewat .env

saat ini kalo kita mau login harus ngisi secret sendiri juga soalnya, aku mau dibikin website ini lebih proffesional karena nanti rencana mau saya komersilkan, jadi siapapun bisa join dengan mudah


saya ingin fitur register tenant bisa dilakukan lewat web dan saat register tenant nanti bisa langsung login, lalu buat tenant otomatis

jadi saat user register nanti dia isi form
- nama tenant (harus unik agar tidak bentrok dengan user lain)
- email
- password
- konfirmasi password

maka nanti akan otomatis dibuatkan tenant untuk user tersebut

