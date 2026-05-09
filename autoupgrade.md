saya mau membuat bot autoupgrade netflix premium, konsepnya sama seperti bot reset netflix dan bot auto reload ini saya juga mau ditambahkan tombol di dashboard "auto upgrade premium" di halaman account list (taruh dibawah autoreset dan auto reload aja tombol nya)

berikut alur nya

bot buka netflix.com/changeplan
cek apakah login atau tidak jika tidak login request link login di netflix.com/login help
bot nangkap email reset dari GAS lalu login aja tapi jangan isi password
langsung redirect aja ke netflix.com/changeplan

di netflix.com/changeplan 

jika plan saat ini mobile <label data-uia="plan-selection+option+4120" 
maka akan di upgrade ke premium <label data-uia="plan-selection+option+3108" 

jika plan saat ini basic <label data-uia="plan-selection+option+4001" 
maka akan di upgrade ke premium <label data-uia="plan-selection+option+3108" 

jika plan saat ini standart <label data-uia="plan-selection+option+3088" 
maka akan di upgrade ke premium <label data-uia="plan-selection+option+3108" 

jika plan saat ini premium <label data-uia="plan-selection+option+3108" 
maka tidak akan di upgrade (sudah paket tertinggi)

setelah itu bot klik <button class="e136yimv2 default-ltr-iqcdef-cache-1s2x9mj" data-uia="cta-change-plan" type="button">Lanjut</button>

akan ada 2 kemungkinan

1. tanpa verifikasi 
jika tanpa verifikasi bot cukup langsung tekan konfirmasi aja <button class="btn modal-action-button btn-blue btn-small" type="button" autocomplete="off" tabindex="0" data-uia="action-button">Konfirmasikan</button>

2. butuh verifikasi
bot klik <div data-uia="account-mfa-button-OTP_EMAIL+label" id=":ru:" class="default-ltr-iqcdef-cache-297s2a">Kirim kode melalui email</div>

setelah itu bot nangkap email kode verifikasi dari gas dengan subject "Kode verifikasimu" atau dalam bahasa inggris "Your verification code" kode nya ini berisi 6 digit ya beda dengan kode masuk, jadi pastikan ambil dengan subject itu

setelah dapat kode nya isikan di <input pattern="[0-9]*" inputmode="numeric" type="text" autocomplete="one-time-code" dir="ltr" id=":r10:" name="challengeOtp" data-uia="collect-otp-input-modal-entry" data-wct-form-control-element="true" value="" fdprocessedid="eaexn" aria-describedby=":r12:" aria-invalid="true">

setelah itu klik tombol submite <button class="e136yimv2 default-ltr-iqcdef-cache-1bnggtj" data-uia="collect-input-submit-cta" type="submit" fdprocessedid="13jcqh">Kirim</button>

setelah itu bot klik <button class="btn modal-action-button btn-blue btn-small" type="button" autocomplete="off" tabindex="0" data-uia="action-button" fdprocessedid="ak2pp9">Konfirmasikan</button>

selesai 






