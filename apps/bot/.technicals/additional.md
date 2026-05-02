# Informasi Volve Capital Bot

file ini adalah informasi tambahan yang belum ada di concept.md.

## Technology Stack
1. NodeJS: sebagai runtime aplikasinya.
2. typescript: kode ditulis dengan typescript.
3. playwright: library web automation.
4. better-sqlite3: library sqlite.
5. winston: library logger.
6. js-toml: library membaca toml file.
7. node-cron: library untuk scheduler.
8. ncc: library untuk bundle kode menjadi 1 file index.js setelah build.

## Notes and Changes
di summary concept.md ada bahasan tentang tls fingerprinting, impit, cookie, dll. untuk konsep **Volve Capital Bot** sebagai aplikasi itu tidak perlu dimasukkan karena konsep nya diganti dari bypass with fetch dengan browser langsung yang dikontrol dengan playwright (konsep tentang module dengan mode loop atau always run).

kemudian di concept.md juga ada bahasan tentang module shopeeModule atau semacamnya, untuk tahap ini kita skip dulu pembuatan module nya, fokus pada core appnya. pembuatan kode module adalah tahap selanjutnya setelah core appnya selesai.