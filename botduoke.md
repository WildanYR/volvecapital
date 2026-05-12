<input type="text" autocomplete="off" valuekey="value" popperclass="login_account_popper" placeholder="Email" fetchsuggestions="function () { [native code] }" triggeronfocus="true" debounce="0" placement="bottom-start" popperappendtobody="true" class="el-input__inner" role="textbox" aria-autocomplete="list" aria-controls="id" aria-activedescendant="el-autocomplete-6719-item--1">

<input type="text" autocomplete="off" placeholder="Password" class="el-input__inner">

<input type="text" autocomplete="off" maxlength="4" placeholder="Verification Code" class="el-input__inner">


<label data-v-374fa5cc="" class="el-checkbox checkbox_wrap policy_checkbox"><span class="el-checkbox__input"><span class="el-checkbox__inner"></span><input type="checkbox" aria-hidden="false" true-value="1" false-value="0" class="el-checkbox__original"></span><span class="el-checkbox__label"><span data-v-374fa5cc="">Agree and accept <a data-v-374fa5cc="" href="javascript:" target="_self" place="term">Terms of Use</a> and <a data-v-374fa5cc="" href="javascript:" target="_self" place="privacyPolicy">Privacy Policy</a> and <a data-v-374fa5cc="" href="javascript:" target="_self" place="dpa">DPA</a></span><!----></span></label>

tombol login <button data-v-374fa5cc="" type="button" class="el-button el-button--primary"><!----><!----><span>Login</span></button>

belum baca <sup class="el-badge__content el-badge__content--undefined is-fixed" style="">1</sup>

<div data-v-6b3481d5="" class="buyer_name">gigihkurniawangk6</div>

bantu aku membuat modul bot baru dong, saat ini kan ada module shopee dan netflix aja, nah aku mau buat module satu lagi untuk duoke, yang mana ini fungsi nya untuk auto balas pesan 

jadi flow nya begini :

bot buka https://web.duoke.com/?lang=en#/dk/main/chat
cek apakah sudah login atau belum jika sudah login maka jalankan logic flow nya
jika belum login maka aku mau loginin manual dulu aja beri log (silahkan login manual terlebih dahulu)

jika sudah login dan membuka https://web.duoke.com/?lang=en#/dk/main/chat
maka bot akan mencari element yang ada text nya "belum baca" atau class <sup class="el-badge__content el-badge__content--undefined is-fixed" style="">1</sup>

jika ada maka klik elemen tersebut (dia punya class nama nya buyer_name <div data-v-6b3481d5="" class="buyer_name">gigihkurniawangk6</div>
lalu tulis pesan di <textarea autocomplete="off" valuekey="value" popperclass="inst_msgs_popper_new" placeholder="Press / to trigger quick reply" maxlength="600" autofocus="autofocus" fetchsuggestions="function () { [native code] }" debounce="0" placement="top-start" popperappendtobody="true" highlightfirstitem="true" class="el-textarea__inner" role="textbox" aria-autocomplete="list" aria-controls="id" aria-activedescendant="el-autocomplete-194-item--1" style="min-height: 37px;"></textarea>

jawab dengan "Ready kak Silahkan Order" tekan enter untuk send

nah aku juga mau tulisan "Ready kak Silahkan Order" bisa aku customize di .env 
# Balasan global (bisa multi baris pakai "||")
REPLY_LINES=Ready kak silahkan order || langsung CO aja proses cepat

jika sudah balas maka catat username itu dan jika user itu chat lagi di hari yang sama maka bot tidak akan membalas lagi biar ga spam, bot akan membalas lagi jika sudah lewat jam 00:00 

aku mau looping terus menerus bot nya untuk mencari pesan yang belum dibaca, 
tapi aku juga mau buat juga sistem nya jadi bot hanya bisa membalas user yang sama maksimal 1 kali dalam sehari, jadi misal ada user yang chat tanggal 11 mei jam 22.00 maka dia baru bisa dibalas lagi di tanggal 12 mei jam 00:00, 

