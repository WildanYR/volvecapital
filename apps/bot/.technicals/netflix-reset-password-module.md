# Netflix Reset Password Module

## Overview

ini adalah module untuk melakukan reset password pada akun netflix.

## Locator and URL

### URL

- change password: https://netflix.com/password
- request reset password: https://www.netflix.com/LoginHelp

### Locator

#### Change Password Page

- login help anchor: [data-uia="change-password-page+button"]
- current password input: [data-uia="change-password-form+current-password-input"]
- new password input: [data-uia="change-password-form+new-password-input"]
- confirm new password input: [data-uia="change-password-form+reeneter-new-password-input"]
- checkbox log all devices: [data-uia="change-password-form+soad-checkbox"]
- button submit: [data-uia="change-password-form+save-button"]

#### Request Reset Password Page

- radio email: [data-uia="login-help-radio-email"]
- email input: [data-uia="email"]
- send email button: [data-uia="emailMeButton"]

## Functionality

### Loop

pada module ini tidak ada fungsi executeLoop.

### Reset Netflix Password Function

#### Function Parameters
fungsi ini menerima data Task dengan type payloadnya sebagai berikut:
```json
{
  "id": "string",
  "email": "string",
  "password": "string",
  "newPassword": "string"
}
```

#### 0. Setup

1. buat browser context dengan nama `${sanitizeEmail(email)}-netflix-respass`, sanitizeEmail adalah fungsi untuk mengubah karakter seperti @ dan . menjadi _.

#### 1. Auth Check

1. buka url change password.
2. deteksi locator login help anchor dan current password input secara bersamaan dengan Promise.race, jika login help anchor yang terdeteksi maka akun belum login jalankan step 2.1, jika current password input yang terdeteksi maka akun sudah login jalankan step 2.2.

#### 2.1. Request Reset Password

1. klik radio email, pastikan radio email yang terseleksi.
2. isi email input dengan `email` dari payload.
3. klik send email button.
4. distep ini lakukan `waitForTaskEvent` untuk menunggu event dari event bus dengan nama `${sanitizeEmail(email)}:NETFLIX_RESET_PASSWORD`. saat ini `waitForTaskEvent` belum diimplemntasikan di base module, referensi dari implementasinya ada di .technicals/module-wait-for-event.md.
5. dari `waitForTaskEvent` nanti akan memberikan data berupa:
```
{
  from: string;
  date: string;
  subject: string;
  data: string;
}
```
yang dibutuhkan dari respon datanya adalah `data` yang berisi link untuk reset password.
6. buka link dari `data` dari respon event di page yang saat ini dipakai, jangan buat page baru.
7. tunggu sampai new password input muncul.
8. fill new password input dengan `newPassword` dari payload.
9. fill confirm new password input dengan `newPassword` dari payload.
10. centang checkbox log all devices, biasanya default checkbox nya sudah tercentang, tapi tetap pastikan checkbox tersebut tercentang.
11. klik button submit.
12. sleep selama 1 detik.

#### 2.2. Change Password

1. fill current password input dengan `password` dari payload, ini adalah password lama.
2. fill new password input dengan `newPassword` dari payload, ini adalah password baru.
3. fill confirm new password input dengan `newPassword` dari payload, ini adalah password baru.
4. centang checkbox log all devices, biasanya default checkbox nya sudah tercentang, tapi tetap pastikan checkbox tersebut tercentang.
5. klik button submit.
6. sleep selama 1 detik.

#### 3. Save Browser Context State and close

setelah semua proses selesai, jangan lupa untuk save storage state dari browser context dengan custom name di step setup tadi dan tutup browser/ task done. karena ini bukan fungsi loop maka bisa langsung tutup browser/ task done.

## Notes (ignore this section, this is just for reference)

anchor dihalaman /password jika belum login
[data-uia="change-password-page+button"]
<a class=" ea2wixt2 default-ltr-iqcdef-cache-z8uyg6" data-cl-command="CancelCommand" data-uia="change-password-page+button" data-cl-view="loginHelp" href="/LoginHelp">Kirim Link Lain</a>

radio email di request reset password
[data-uia="login-help-radio-email"]
<input type="radio" id=":Rakqlalaalbalbaldakql76:" name="forgotPasswordChoice" data-uia="login-help-radio-email" data-wct-form-control-element="true" checked="" value="email">

email input di request reset password
[data-uia="email"]
<input type="email" dir="ltr" id=":Rakqlalaelbalbaldakql76:" name="email" data-uia="email" data-wct-form-control-element="true" value="">

button kirimi saya email
[data-uia="emailMeButton"]
<button class=" ea2wixt2 default-ltr-iqcdef-cache-1jimofo" data-uia="emailMeButton" type="button">Kirimi Saya Email</button>

new password input
[data-uia="change-password-form+new-password-input"]
<input autocomplete="new-password" type="password" dir="ltr" id=":rb:" name="new-password" data-uia="change-password-form+new-password-input" data-wct-form-control-element="true">

confirm new password input
[data-uia="change-password-form+reeneter-new-password-input"]
<input autocomplete="new-password" type="password" dir="ltr" id=":rf:" name="reeneter-new-password" data-uia="change-password-form+reeneter-new-password-input" data-wct-form-control-element="true">

checkbox log all devices
[data-uia="change-password-form+soad-checkbox"]
<input type="checkbox" id=":rj:" name="soad-checkbox" data-uia="change-password-form+soad-checkbox" data-wct-form-control-element="true" checked="">

button submit
[data-uia="change-password-form+save-button"]
<button class="e1g2phft1 ea2wixt2 default-ltr-iqcdef-cache-11g9jyn" gap="small" data-uia="change-password-form+save-button" data-cl-command="SubmitCommand" type="submit">Simpan</button>
atau bisa pakai button[type="submit"]

dihalaman /password setelah login

input password sekarang
[data-uia="change-password-form+current-password-input"]
<input autocomplete="current-password" type="password" dir="ltr" id=":r6:" name="current-password" aria-describedby=":r8:" data-uia="change-password-form+current-password-input" data-wct-form-control-element="true" value="">

input new password
[data-uia="change-password-form+new-password-input"]
<input autocomplete="new-password" type="password" dir="ltr" id=":ra:" name="new-password" data-uia="change-password-form+new-password-input" data-wct-form-control-element="true">

input confirm new password
[data-uia="change-password-form+reeneter-new-password-input"]
<input autocomplete="new-password" type="password" dir="ltr" id=":re:" name="reeneter-new-password" data-uia="change-password-form+reeneter-new-password-input" data-wct-form-control-element="true">

checkbox logout all devices
[data-uia="change-password-form+soad-checkbox"]
<input type="checkbox" id=":ri:" name="soad-checkbox" data-uia="change-password-form+soad-checkbox" data-wct-form-control-element="true" checked="">

button submit
[data-uia="change-password-form+save-button"]
<button class="e1g2phft1 ea2wixt2 default-ltr-iqcdef-cache-11g9jyn" gap="small" data-uia="change-password-form+save-button" data-cl-command="SubmitCommand" type="submit">Simpan</button>
atau bisa pakai button[type="submit"]