12:06:47 INFO  Received event: cunda_mania77_gmail_com:NETFLIX_REQ_RESET_PASSWORD
12:06:47 INFO [netflix] Received reset link: https://www.netflix.com/password?g=4a93e557-c2c6-4f4b-8871-a67a9252e0ae&lkid=URL_CTA&lnktrk=EVO&nftoken=BgjXuOvcAxLEAYSjgTCoRPZAK5%2Fjj5%2BsDdw0E1FKZ8ryEMSlDG%2Blu7X3dCydM1kTzSNLkhVhndYxejebH7UFk%2FwXQcUwJHJcRNgGE2Zr5Np26wdz6wBPzxO3wVz15whxnTDVn6dBdXEjUu9LYfxdId9Ji9YXaSvIrzaLRCFrh5Zue41UwBIu1LvIRFGEONVc5RazFdd14lYcvWM50hAjiahb9SR0MrAatNrQ2C9i9kHF2Gwc%2Bqqol4IOpBEl%2FUA1uT%2BczhyAqL20KmjAniEYBiIOCgzO0GoGEQPJCgsEa%2BU%3D
12:06:53 INFO [netflix] Waiting for Netflix to confirm password change...
12:07:03 INFO [netflix] Current page after submit: https://www.netflix.com/account
12:07:03 INFO [netflix] Password reset/change completed. Waiting 10s before closing...
12:07:13 INFO [netflix] Password reset/change submitted successfully
12:07:13 INFO  Task completed: 1777784774859


okey mantab sudah berhasil yang itu tadi

tapi sekarang aku mau yang lebih canggih.
untuk saat ini kan bot nya kan ada 2 skenario

Bot membuka halaman `netflix.com/password` dan melakukan pengecekan cepat (race condition) untuk menentukan status:
*   Jika muncul input password lama -> **Status: Logged In**.
*   Jika diarahkan ke halaman Login -> **Status: Not Logged In**.

nah di skenario  **Status: Not Logged In**. untuk saat ini kan langsung ngarah ke netflix.com/loginhelp
aku mau sebelum kesitu bot nya mau coba login dengan password lama yang ada di database

jadi saat dia ke netflix.com/password status nya dia tidak login maka dia coba login manual dulu dengan ngeklik seperti dibawah ini

1. input email yang mau di reset <input type="text" autocomplete="email" dir="ltr" id=":R5akql6l9allbaldajkm:" name="userLoginId" data-uia="field-userLoginId" data-wct-form-control-element="true" value="" aria-describedby=":R5akql6l9allbaldajkmH1:" aria-invalid="true">

itu kode HTML buat referensi untuk anda ya

2. setelah email di input klik tombol continue atau lanjutkan ==> <button class="e136yimv2 default-ltr-iqcdef-cache-13gp4ap" data-uia="continue-button" type="submit">Continue</button> atau bisa pakai kode HTML ini

3. setelah klik lanjutkan bot memastikan ada 4 kotak untuk memasukan kode <input pattern="[0-9]*" inputmode="numeric" type="text" autocomplete="one-time-code" dir="ltr" id=":r2:" name="challengeOtp" data-uia="pin-entry" data-wct-form-control-element="true" value="">

4. jika sudah ada 4 kotak untuk memasukan kode itu bot langsung ngeklik expand gethelp/dapatkan bantuan ==> <p class="default-ltr-iqcdef-cache-10q3hvf e1vs384d0">Get Help</p> ini kode HTML untuk referensi mu ya

5. setelah klik expand gethelp/dapatkan bantuan bot akan ngeklik tulisan "use password instead" ==> <a class="egsim9q0 default-ltr-iqcdef-cache-1r98vjr" data-uia="usePasswordInsteadHelpMenuItem" href="#">Use password instead</a> ini kode HTML untuk referensi mu ya soalnya kadang bahasa indonesia tulisan nya

6. setelah klik tulisan "use password instead" maka akan muncul input untuk memasukan password lama ==> <input type="password" autocomplete="password" dir="ltr" id=":re:" name="password" data-uia="password-input" data-wct-form-control-element="true" value="" aria-describedby=":rf:" aria-invalid="true">

7. bot memasukan sandi lama itu yang dari database kita ya

8. setelah itu bot klik sign in ==> <button class="e136yimv2 default-ltr-iqcdef-cache-13gp4ap" data-uia="sign-in-button" type="submit">Sign In</button> ini kode HTML untuk referensi mu ya

9. nah nanti ada 2 kemungkinan

jika dia berhasil login maka langsung pakai skenario **Status: Logged In**.
jika password salah atau something went wrong maka langsung arahkan ke netflix.com/loginhelp (skenario 2 **Status: Not Logged In**.) 


