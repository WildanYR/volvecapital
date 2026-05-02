ini adalah percakapan yang bisa dijadikan dasar untuk memahami app Volve Capital Bot (dengan summary perkembangan percakapan sebelumnya yang tidak disertakan karena terlalu panjang):

---

## Konseptor

aku akan buatkan konsep sederhana dari app yang ingin aku buat ini, kamu kasih komentar tentang apa yang belum kamu pahami dan jika ada celah yang masih kurang dari konsep yang aku buat bisa kamu tambahkan, ini nantinya ketika kamu sudah paham dengan apa yang aku mau kamu bisa buatkan dokumen detailnya, dan berikut konsep yang aku buat:

a. `Task Manager`: sebagai core dari app ini yang mengatur bagaimana menjalankan multiple module. di dalam `Task Manager` akan ada global queue yang menyimpan task yang menunggu untuk dikerjakan, karena dalam app nya akan dibatasi hanya bisa mengerjakan berapa task sekali jalan.

b. `Module`: sebagai wrapper fungsi fungsi yang bisa dijalankan oleh `Task Manager`, di `Module` ini aku ingin ada 2 kategori task yang bisa dijalankan:

- Task yang dijalankan terus menerus/ looping, untuk kategori ini tidak dimasukkan kedalam queue tapi dijalankan langsung karena ini loop yang tidak berhenti kecuali di stop manual.
- Task yang dijalankan sekali, task inilah yang akan masuk ke queue menunggu dijalankan.
  tiap module itu ibaratnya seperti 1 browser context di playwright, jadi dia akan menyimpan statenya masing masing dalam file json. dan module ini sifatnya lebih seperti abstraksi, sehingga app bisa menjalankan lebih dari satu module yang sama dengan id/ nama yang berbeda.
  module ini bukan yang menginisiasi browser context, tapi dia hanya menerima browser contextnya yang diinisiasi oleh `Task Manager`, jadi semua kontrolnya ada di task manager. jadi module yang sudah terinisiasi ini posisinya sebagai child dari `Task Manager` yang juga bisa mengakses Task Managernya sebagai parent.

c. `Scheduler`: ini adalah konsep untuk menjalankan task pada waktu tertentu, terhubung dengan `Task Manager` sehingga bisa dipanggil oleh module module childnya, nanti task yang ada di scheduler ini ketika dijalankan tetap ikut aturan queue, jadi dia akan masuk ke queue dan dikerjakan urut jika ada task yang sedang dikerjakan maka dia akan ada diurutan setelah task yang lain selesai. contoh aplikatifnya: jalankan fungsi X dari instance module A pada tanggal 1 Februari 2026 jam 07.00 wib.

d. `Config File`: nah ini adalah apa yang perlu di edit oleh user yang menggunakan aplikasi ini, jadi config file ini nanti akan berformat TOML karena menurutku ini mudah untuk diedit oleh orang awam, kalo YAML dia perlu memperhatikan indentasi jadi ada kemungkinan orang awam akan sulit mengeditnya.
Config file ini nantinya berisi module yang dijalankan, contohnya gini:
[Module]
module = nama_module_yang_ada_di_app
name = id dari instance module, ini yang dipakai untuk start stop instancenya
data-data-yang-diperlukan-module = setelah module yang akan dijalankan dan id nya selanjutnya adalah data data/ parameter untuk menjalankan module.
jadi jika di config file ada 2 [module] maka appnya akan menjalankan 2 module instance di task manager.

e. `Event`: ini seperti scheduler yang juga terhubung dengan `Task Manager`, dan ini pakai pattern Event Emitter yang bisa di subscribe oleh `Module` untuk menjalankan fungsi tertentu. misal untuk menjalankan fungsi di instance module A dari instance module B. jadi tiap instance module bisa saling terhubung.

f. `Connector`: ini adalah real time konektor menggunakan websocket untuk terkoneksi dengan eksternal untuk mengontrol app ini, jadi nanti ada 3rd-party app diluar app ini yang terkoneksi dengan app ini menggunakan websocket yang bisa mentrigger fungsi di `Module` untuk dijalankan langsung atau masuk ke `Scheduler` untuk dijalankan di jam/ hari lain.

---

begitulah konsep yang terpikirkan olehku, mungkin format dan urutannya masih acak tapi aku ingin kamu coba analisa dan pahami, kemudian berikan komentar

---

## Analis Intelek

Konsep yang kamu buat sudah **sangat matang dan terstruktur**. Kamu sudah memikirkan aspek skalabilitas (`Task Manager`), kemudahan penggunaan (`Config TOML`), hingga interoperabilitas (`Event` & `Connector`).

Struktur ini mengingatkan saya pada arsitektur _Micro-kernel_ atau _Plugin-based system_ yang modern.

Berikut adalah analisa mendalam, poin yang sudah saya pahami, serta komentar/celah yang perlu ditambal sebelum kita buat dokumen teknisnya:

---

### 1. Analisa Per Komponen

#### **a. `Task Manager` (The Core)**

- **Pemahaman:** Ini adalah "Otak" yang mengatur lalu lintas. Dia punya **Global Queue** dan **Concurrency Limit** (misal: max 3 browser jalan bersamaan). Dia yang menginisiasi browser (`Playwright`) dan menyuntikkannya (dependency injection) ke dalam Module saat dibutuhkan.

- **Komentar/Celah:**
    - **Priority Queue:** Apakah semua task dianggap setara? Atau ada task "VIP"? (Misal: User trigger via WebSocket harus jalan duluan dibanding Scheduler rutin). _Saran: Tambahkan level prioritas pada queue (High/Normal/Low)._

    - **Zombie Process:** Bagaimana jika browser crash atau hang? Task Manager butuh mekanisme _Time-to-Live (TTL)_. Jika task berjalan > 5 menit, kill browser dan tandai task gagal agar antrian tidak macet.

#### **b. `Module` (The Worker)**

- **Pemahaman:** Abstraksi logika bisnis. Punya 2 mode: **Looping** (Monitoring/Fetch API) dan **One-time Task** (Browser Interaction). Module menyimpan _State_ (Cookies/Session) sendiri. Module bersifat pasif (menunggu browser dikasih oleh Task Manager).

- **Komentar/Celah:**
    - **Resource Conflict di Looping:** Kamu menyebut task looping "dijalankan terus menerus". Perlu diperjelas: Task looping ini harusnya **Lightweight (Node.js Fetch)** seperti diskusi kita sebelumnya (metode hybrid). Jangan sampai task looping ini memegang browser context terus-menerus, karena itu akan memakan slot concurrency di Task Manager.

    - **State Isolation:** Karena satu Module bisa di-instantiate berkali-kali dengan ID beda (misal: `shopee_toko_A`, `shopee_toko_B`), pastikan file JSON session-nya terpisah path-nya berdasarkan `instance_name` agar tidak saling timpa.

#### **c. `Scheduler` (The Timer)**

- **Pemahaman:** Cron job yang cerdas. Saat waktunya tiba, dia tidak langsung eksekusi, tapi **melempar task ke Queue Task Manager**. Ini bagus untuk menjaga kestabilan resource.

- **Komentar/Celah:**
    - **Persistence (Ketahanan Data):** Jika App mati/restart, bagaimana nasib jadwal yang belum tereksekusi? Apakah scheduler menyimpan jadwal di memori (RAM) atau di file database (SQLite/JSON)? _Saran: Gunakan simple file-based DB (misal `lowdb` atau `sqlite`) agar jadwal tidak hilang saat restart._

#### **d. `Config File` (TOML)**

- **Pemahaman:** User interface bagi orang awam. TOML sangat tepat karena sintaksnya `key = value` sangat intuitif dibanding kurung kurawal JSON atau indentasi YAML.

- **Komentar/Celah:**
    - **Hot Reload:** Apakah user perlu restart aplikasi setiap edit config? Atau App bisa mendeteksi perubahan file TOML dan otomatis me-restart module yang berubah saja? (Ini fitur "nice to have" tapi sangat berguna).

    - **Validation:** App perlu validasi ketat saat startup. Jika user salah ketik nama module, App harus memberi error yang manusiawi, bukan crash dengan log error koding.

#### **e. `Event` (The Signal)**

- **Pemahaman:** Komunikasi antar module tanpa saling _import_. Module A emit `ORDER_RECEIVED`, Module B (misal: Module Notifikasi Telegram) listen event itu.

- **Komentar/Celah:**
    - **Global Event Bus:** Event Emitter ini harus berada di level `Task Manager` atau Global Scope agar bisa diakses semua module instance.

#### **f. `Connector` (The Remote)**

- **Pemahaman:** Pintu gerbang eksternal via WebSocket. Memungkinkan kontrol dari dashboard web, aplikasi mobile, atau server lain.

- **Komentar/Celah:**
    - **Security:** Ini celah keamanan terbesar. Siapa saja yang tau URL WebSocket bisa mengontrol bot. _Saran: Perlu mekanisme otentikasi sederhana, minimal API Key / Token statis di Config File._

---

### 2. Tambahan Celah & Ide (Missing Puzzle)

Ada dua komponen teknis yang menurut saya "hilang" atau perlu ditambahkan agar konsep ini utuh:

#### **g. `Logger & Notification System`**

- User awam butuh tahu apa yang terjadi. `console.log` tidak cukup.

- Perlu sistem Log terpusat yang mencatat ke file (untuk debug) dan emit ke `Connector` (agar bisa tampil di UI eksternal secara realtime).

- Format Log: `[TIMESTAMP] [MODULE_ID] [LEVEL: INFO/ERROR] Pesan...`

#### **h. `Error Handling & Recovery Strategy`**

- Apa yang terjadi jika internet mati 1 jam?

- Apa yang terjadi jika module Shopee error terus menerus (misal API berubah)?

- Perlu konsep **Circuit Breaker**: Jika Module A error 5x berturut-turut, "istirahatkan" module itu selama 30 menit agar tidak membanjiri log error atau menghabiskan kuota proxy, lalu coba lagi nanti.

---

### 3. Koreksi Pemahaman Flow (Konfirmasi)

Saya ingin memastikan pemahaman saya tentang hubungan `Module` dan `Task Manager` dalam konteks **Hybrid** (Fetch + Browser) yang kita bahas sebelumnya:

1.  **Start:** App baca TOML -> Task Manager membuat instance Module (misal `Shopee-A`).

2.  **Looping Mode (Lightweight):** Module `Shopee-A` menjalankan interval fetch API (menggunakan `impit` Node.js). Ini berjalan di background **TANPA** masuk Queue Task Manager (karena ringan).

3.  **Trigger:** Fetch menemukan order baru -> Module `Shopee-A` membuat objek Task `ProcessOrder`.

4.  **Queue:** Task `ProcessOrder` dikirim ke `Task Manager`.

5.  **Execution:**
    - Task Manager cek slot (misal: slot tersedia).

    - Task Manager buka Browser (Playwright).

    - Task Manager panggil fungsi `module.executeTask(browserContext)`.

    - Module bekerja menggunakan browser itu.

6.  **Finish:** Task selesai -> Task Manager tutup Browser -> Slot kosong kembali.

Apakah alur di atas sudah sesuai dengan bayanganmu?

Jika **YA**, saya siap menyusun **Dokumen Spesifikasi Teknis (Technical Spec)** yang detail mulai dari struktur folder, interface class, hingga skema config TOML-nya. Bagaimana?

---

## Konseptor

menambahkan dan menjawab pertanyaanmu:

1. kamu bilang **Concurrency Limit** (misal: max 3 browser jalan bersamaan), konsep concurrency limitnya benar untuk membatasi, tapi bukan membatasi berapa banyak browser yang terbuka tapi berapa banyak task yang dijalankan, jadi kalo aku set limtnya ke 5 task dan 5 task yang dikerjakan ini adalah dari 5 instance module yang berbeda maka dia tetap akan menjalankan 5 browser dengan state nya masing masing.
2. untuk Priority Queue, aku tidak memerlukan priority pada tasknya, semua setara dan semua ikut aturan FIFO (first in first out).
3. untuk masalah zombie process, kamu benar, perlu ada mekanisme time to live.
4. untuk bagian `Module` pada mode looping ini aku tidak membatasi apa yang bisa dia lakukan, jadi tidak ada batasan lightweight, module bisa melakukan loop dengan menjalankan browser tanpa menutupnya selama tidak ada error atau ditutup manual, dan tambahan penting disini, bahwa instance module loop jika menjalankan browser, dan ada task one-time yang dijalankan maka dia membuka tab baru di browser yang terbuka bukan malah buka browser baru. sama tambahan sistem recycle browser, misal setelah loop 30 kali maka dia akan ada jeda untuk menutup browser kemudian membukanya kembali agar refresh penggunaan resource.
5. untuk state isolation di module, kamu sudah benar, memang tiap instance module akan punya state file nya masing masing sesuai id/ nama instancenya yang ada di config file.
6. lanjut ke bagian scheduler dan sekalian aku tambahkan yang sebelumnya kurang, yaitu penggunaan sqlite, jadi data apapun yang perlu di persist akan tersimpan di sqlite termasuk data dari status pesanan yang diproses.
7. untuk config file tidak perlu hot reload, user sudah paham jika mengubah config maka perlu restart app. dan untuk validasi ketat, itu wajib ada, jangan sampai app jalan tapi konfignya tidak jelas.
8. untuk event, tentu event itu levelnya di global. dan tiap instance bisa dibuat nama event nya dinamis saja, karena kan bisa menjalankan module yang sama dengan banyak instance misal event ORDER_RECIEVED nanti bisa dibuat unik per instance misal shopee_toko_a_ORDER_RECIEVED.
9. untuk bagian connector websocket, tentu perlu menerapkan standar security, tidak perlu yang terlalu kompleks tapi yang standar saja sudah cukup.
10. nah sekarang masuk ke logger & notification systemnya, kamu betul aku lupa menambahkan, untuk logger aku ingin yang sederhana saja, di console log dan file lokal, kemudian tiap logger juga perlu fetch api ke server untuk mengirim lognya, dan ini sudah ada servernya yang jalan tinggal implementasi saja.
11. Error Handling & Recovery Strategy, kamu benar, perlu ada strategi untuk handling error, untuk sekarang mungkin saranmu itu sudah cukup bagus.
12. selanjutnya mengenai flow, apa yang kamu pahami itu secara garis besar sudah benar dengan catatan bahwa task mode loop yang jalan terus menerus bisa juga melakukan heavy task seperti yang aku jelaskan dipoin 4.

---

gimana tanggapanmu? apakah masih ada yang belum jelas atau masih ada yang kurang?

---

## Analis Intelek

Tanggapan saya: **Sangat Jelas.** Koreksi dan tambahan poin 1-12 yang kamu berikan sangat krusial, terutama di bagian **Task Mode Loop yang fleksibel (bisa Heavy/Persistent Browser)** dan mekanisme **Recycle Browser**. Ini mengubah sedikit cara `Task Manager` mengelola resource (tidak selalu _spawn & kill_, tapi juga _reuse context_).

Dengan spesifikasi final ini, kita sudah siap masuk ke tahap **Desain Teknis**.

Berikut adalah **Dokumen Spesifikasi Teknis (Technical Specification Document)** untuk **Volve Capital Bot**. Dokumen ini akan menjadi acuan "Blueprints" kita saat coding.

---

# Volve Capital Bot - Technical Design Document (TDD)

## 1. Architecture Overview

Aplikasi ini menggunakan arsitektur **Modular Orchestrator** berbasis Node.js.

- **Single Source of Truth:** SQLite Database (untuk persistence, scheduler, dan log queue).

- **State Management:** JSON Files (cookie/session) & SQLite.

- **Concurrency Model:** Global Task Queue dengan batas jumlah task eksekusi simultan (Semaphore).

## 2. Core Components

### A. Task Manager (The Kernel)

Bertanggung jawab atas siklus hidup aplikasi dan manajemen resource.

- **Global Queue (FIFO):** Menggunakan `better-queue` atau in-memory array yang dibackup SQLite.

- **Concurrency Control:** Membatasi jumlah task aktif (misal `max: 5`).

- **Browser Management Logic:**
    1.  Cek apakah target Module instance sedang memiliki _Active Browser Context_ (dari Loop Mode).

    2.  **Jika Ya:** Inject context tersebut ke task (buka `newPage`).

    3.  **Jika Tidak:** Spawn browser context baru -> Jalankan Task -> Close Context.

- **Zombie Killer:** Timer `setTimeout` pada setiap eksekusi task. Jika melebihi batas (misal 5 menit), paksa `browser.close()` dan lempar error timeout.

### B. Module System (The Plugin)

Setiap module (misal: `ShopeeModule`) adalah class yang meng-extend `BaseModule`.

- **Properties:** `instanceId`, `config`, `browserContext` (jika persisten).

- **Lifecycle Methods:**
    - `init()`: Load state JSON.

    - `startLoop()`: Menjalankan interval/loop proses.
        - _Fitur Recycle:_ Di dalam loop, counter `i++`. Jika `i >= recycleLimit`, tutup browser, tunggu, buka lagi.

    - `executeTask(taskData, context?)`: Menjalankan one-time task. Menerima `context` dari Task Manager (baik context baru atau reuse).

    - `stop()`: Graceful shutdown.

### C. Database Layer (SQLite)

Menggunakan library `better-sqlite3` untuk performa tinggi dan sync I/O (aman untuk integrity).

- **Table `kv_store`:** Key-Value store sederhana untuk menyimpan state scheduler atau flag.

- **Table `tasks`:** Menyimpan history task yang selesai dan statusnya.

- **Table `orders`:** Menyimpan data pesanan yang sudah diproses (agar tidak diproses ganda).

- **Table `logs`:** Buffer log sebelum dikirim ke API.

### D. Config & Validation

- **Format:** TOML (`config.toml`).

- **Library:** `@ltd/j-toml` (parser) + `zod` (validasi skema).

- **Strict Mode:** App crash saat startup jika config invalid (contoh: module tidak ditemukan, field kurang).

### E. Logger System

- **Transport 1:** Console (Pretty print).

- **Transport 2:** File (`logs/app.log` dengan rotasi harian).

- **Transport 3:** API Push (Batch sending setiap X detik atau realtime tergantung urgensi).

### F. External Connector (WebSocket)

- **Library:** `ws` atau `socket.io`.

- **Security:** Handshake awal wajib mengirim header `Authorization: Bearer <TOKEN_DARI_CONFIG>`.

- **Capability:**
    - Trigger Task instan.

    - Add Schedule.

    - Subscribe ke Log stream.

---

## 3. Data Flow Diagram

1.  **Loop Flow (Persistent):**

    `Module Loop` -> `Browser Open` -> `Crawl` -> `Wait` -> `Recycle Check` -> `Repeat`.

2.  **Task Flow (Reuse Context):**

    `Task Queue` -> `Task Manager` -> _Cek Module A punya Browser?_ -> **YA** -> `Module A (New Tab)` -> `Execute` -> `Close Tab`.

3.  **Task Flow (Fresh Context):**

    `Task Queue` -> `Task Manager` -> _Cek Module A punya Browser?_ -> **TIDAK** -> `Spawn Browser` -> `Module A` -> `Execute` -> `Kill Browser`.

---

## 4. File Structure

Plaintext

```
volve-capital-bot/
├── config.toml             # User Configuration
├── session_data/           # JSON StorageStates (Ignored by Git)
│   ├── shopee_toko_a.json
│   └── ...
├── storage/                # SQLite DB & Logs
│   ├── database.sqlite
│   └── app.log
├── src/
│   ├── main.js             # Entry Point (Bootstrap)
│   ├── core/
│   │   ├── TaskManager.js  # Queue & Concurrency Logic
│   │   ├── Database.js     # SQLite Wrapper
│   │   ├── Logger.js       # Multi-transport Logger
│   │   ├── ConfigLoader.js # TOML Loader & Zod Validation
│   │   ├── EventBus.js     # Global Event Emitter
│   │   └── Connector.js    # WebSocket Server
│   │
│   ├── modules/
│   │   ├── BaseModule.js   # Abstract Class
│   │   └── shopee/         # Shopee Implementation
│   │       ├── index.js    # Logic Loop & Task
│   │       └── ...
│   │
│   └── utils/
│       └── browser.js      # Playwright helper (launch options, user-agent)

```

---

## 5. Rencana Fase Pengerjaan (Step-by-Step)

Agar tidak pusing, kita akan bangun secara bertahap:

1.  **Fase 1: Skeleton & Core**
    - Setup Project (npm init, typescript/js).

    - Implementasi `Logger`, `ConfigLoader` (TOML), dan `Database` (SQLite).

    - Test load config valid/invalid.

2.  **Fase 2: Task Manager & Base Module**
    - Buat `BaseModule` class.

    - Buat `TaskManager` dengan queue FIFO & Concurrency limit.

    - Implementasi logika "Reuse Browser Context".

3.  **Fase 3: Implementasi Shopee Module (Prototype)**
    - Porting kode `impit` dan `playwright` yang sudah kita bahas sebelumnya ke struktur module baru.

    - Implementasi Loop Mode + Recycle Browser.

4.  **Fase 4: Scheduler & Event & Connector**
    - Menambahkan fitur jadwal dan WebSocket.

---

### Apakah kamu setuju dengan dokumen teknis ini?

Jika setuju, langkah selanjutnya adalah **Fase 1**. Aku bisa buatkan kode awal untuk **Setup Project, Config Loader (TOML), dan Logger**. Mau mulai dari situ?

---

## Konseptor

agar menambah modularity, pada bagian tabel database, untuk kv_store, tasks, dan logs itu sebagai tabel yang diperlukan oleh app/ core, terus untuk orders ini tidak masuk ke core tapi masuknya di module, jadi tiap module bisa punya tabel custom nya sendiri dan tentu untuk memisahkan antar instance module maka perlu kolom instance_id agar ada konteks itu data punya instance yang mana.

---

## Analis Intelek

Ide yang sangat brilian. Ini adalah prinsip **Separation of Concerns** yang sesungguhnya.

Dengan memisahkan tabel bisnis (seperti `orders`) dari tabel sistem (`tasks`, `logs`), `Core` benar-benar menjadi agnostik—dia tidak peduli apakah module itu memproses pesanan Shopee, membalas komentar Instagram, atau memantau harga Crypto. `Core` hanya tahu cara menjalankan task.

Berikut adalah revisi desain Database dan Module Interface untuk mengakomodasi request ini:

### 1. Revisi Skema Database

Kita akan membagi tanggung jawab database menjadi dua layer:

#### A. Core Schema (System Level)

Tabel ini dibuat otomatis oleh `Task Manager` saat aplikasi pertama kali jalan.

1.  **`sys_kv_store`**:
    - `key` (PK), `value`, `updated_at`.

    - _Guna:_ Simpan state global, scheduler flags, dll.

2.  **`sys_tasks`**:
    - `id` (PK), `module_instance_id`, `type`, `status` (PENDING/PROCESSING/COMPLETED/FAILED), `payload` (JSON), `created_at`.

    - _Guna:_ Queue antrian task.

3.  **`sys_logs`**:
    - `id`, `module_instance_id`, `level`, `message`, `timestamp`.

    - _Guna:_ Centralized logging.

#### B. Module Schema (Business Level)

Tabel ini dibuat secara dinamis oleh **Module** saat method `init()` dijalankan.

Contoh untuk **ShopeeModule**:

1.  **`shopee_orders`**:
    - `order_sn` (PK - ID Pesanan dari Shopee).

    - `instance_id` (Composite PK atau Index - **PENTING** agar Toko A dan Toko B tidak bentrok).

    - `status`, `buyer_username`, `total_amount`, `processed_at`.

---

### 2. Implikasi pada Kode (Technical Spec Update)

Agar module bisa membuat tabelnya sendiri, kita perlu mengekspos objek Database ke Module, atau Module yang me-request query ke Core.

#### Update `BaseModule.js` (Interface)

Kita tambahkan method `setupSchema()` yang wajib diimplementasikan (atau opsional) oleh module.

JavaScript

```
class BaseModule {
    constructor(dbConnection, instanceId, config) {
        this.db = dbConnection; // Akses langsung ke SQLite wrapper
        this.instanceId = instanceId;
        this.config = config;
    }

    /**
     * Dijalankan sekali saat module di-load.
     * Gunakan ini untuk CREATE TABLE IF NOT EXISTS.
     */
    async setupSchema() {
        // Default: Do nothing
    }

    // ... method lain (startLoop, executeTask)
}

```

#### Implementasi di `ShopeeModule.js`

JavaScript

```
class ShopeeModule extends BaseModule {

    async setupSchema() {
        // Module membuat tabelnya sendiri jika belum ada
        // Perhatikan kolom instance_id untuk isolasi data
        const query = `
            CREATE TABLE IF NOT EXISTS shopee_orders (
                order_sn TEXT,
                instance_id TEXT,
                status TEXT,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (order_sn, instance_id)
            )
        `;
        this.db.exec(query);
        console.log(`[${this.instanceId}] Schema 'shopee_orders' verified.`);
    }

    async saveOrder(orderData) {
        // Saat insert data, wajib sertakan instanceId
        this.db.prepare(
            `INSERT OR IGNORE INTO shopee_orders (order_sn, instance_id, status) VALUES (?, ?, ?)`
        ).run(orderData.sn, this.instanceId, orderData.status);
    }
}

```

---

### 3. Keuntungan Desain Ini

1.  **Data Isolation:** Instance Toko A tidak akan pernah secara tidak sengaja memproses order milik Toko B karena `instance_id` menjadi kunci pemisah di query (misal: `SELECT * FROM shopee_orders WHERE instance_id = ?`).

2.  **Plugin-friendly:** Jika nanti kamu buat module baru, misal `TiktokModule`, kamu bisa buat tabel `tiktok_orders` tanpa mengganggu struktur tabel Shopee atau tabel Core.

3.  **Clean Core:** Core tetap ringan. Jika module Shopee dihapus, tabel `shopee_orders` bisa dibiarkan atau di-drop tanpa merusak integritas tabel `sys_tasks`.

Apakah revisi struktur database ini sudah sesuai dengan keinginanmu? Jika ya, kita kunci desain ini dan lanjut ke **Fase 1 (Coding Setup)**.

---

## Konseptor

oke, sekarang kamu sudah punya pemahaman yang komprehensif, aku ingin kamu buat summary dari diskusi kita ini secara keseluruhan dan tulis ulang TDD nya setelah summary, ohh iya aku ingin summary yang detail buka poin singkat agar developer lain tidak perlu membaca chat panjang kita, cukup baca summary dan paham dengan apa yang kita bahas, perkembangan pemikiran kita, dan TDD nya

---

## Analis Intelek

Tentu, ini adalah rangkuman komprehensif dari seluruh diskusi kita, dirancang agar developer lain dapat membaca alur pikir, tantangan teknis, dan solusi yang kita sepakati tanpa harus membaca ulang seluruh chat history, diikuti dengan Dokumen Spesifikasi Teknis (TDD) final.

---

# Bagian 1: Ringkasan Eksekutif & Evolusi Arsitektur

**Project:** Volve Capital Bot

**Goal:** Membangun _Automation Orchestrator_ modular yang efisien sumber daya (resource-efficient) untuk mengelola banyak akun marketplace (Shopee) dan platform lainnya.

### 1. Latar Belakang & Masalah Awal

Awalnya, sistem menggunakan Playwright dengan pendekatan konvensional: setiap sesi toko membuka satu instance browser yang terus menyala (_always-on_).

- **Masalah:** Konsumsi RAM dan CPU sangat tinggi, membatasi skalabilitas jumlah toko yang bisa dikelola.

- **Ide Awal:** Menggunakan pendekatan _Hybrid_. Browser hanya dibuka saat ada aksi krusial, sedangkan monitoring pesanan dilakukan via HTTP Request (API Fetch) ringan.

### 2. Tantangan Teknis: Hybrid Scraping

Transisi ke HTTP Fetch menghadapi kendala karena target (Shopee) menggunakan React (CSR) dan perlindungan bot yang ketat.

- **Solusi TLS/Fingerprinting:** Node.js standar (`fetch`/`axios`) mudah dideteksi. Kita sepakat menggunakan library seperti `got-scraping` atau `impit` yang mampu meniru TLS Fingerprint (Ciphers) dan Header browser asli agar terlihat seperti user legitimate.

- **Autentikasi & Cookie:** API Shopee membutuhkan cookie spesifik (`SPC_EC`, `SPC_F`) dan header dinamis.

- **Sinkronisasi Sesi (The Split Brain Problem):** Tantangan terbesar adalah menjaga sinkronisasi antara Script Fetch (Node.js) dan Script Browser (Playwright).
    - _Keputusan:_ File JSON (`storagestate.json`) dijadikan **Single Source of Truth (SSOT)**.

    - _Mekanisme:_ Jika Script Fetch mendeteksi rotasi cookie dari server (header `Set-Cookie`), script tersebut **wajib** menulis ulang file JSON. Saat Playwright dibutuhkan, ia akan membaca file JSON yang sudah terupdate tersebut.

### 3. Evolusi Menjadi "Volve Capital Bot"

Diskusi berkembang dari sekadar script bot menjadi sebuah sistem aplikasi modular (seperti OS mini).

- **Konsep Task Manager:** Core aplikasi yang mengatur antrian (Queue) dan konkurensi. Ia tidak peduli tugas apa yang dijalankan, ia hanya tahu cara mengeksekusi dan membatasi jumlahnya.

- **Modularitas:** Logika bisnis (Shopee, Tokopedia, dll) dipisah total dari Core. Module dapat memiliki tabel database sendiri (`shopee_orders`) terpisah dari tabel sistem (`sys_tasks`).

- **Fleksibilitas Module:** Module memiliki dua mode:
    1.  **Loop Mode:** Jalan terus menerus (bisa via Fetch ringan, atau Browser persisten).

    2.  **One-Time Task:** Masuk antrian global, dikerjakan sesuai ketersediaan slot.

- **Lifecycle Browser:** Browser tidak selalu _spawn-kill_. Task Manager mendukung _Context Reuse_ (menggunakan browser yang sudah terbuka dari Loop Mode) dan _Browser Recycling_ (restart berkala untuk mencegah memory leak).

---

# Bagian 2: Technical Design Document (TDD)

**Project Name:** Volve Capital Bot

**Version:** 1.0.0

**Stack:** Node.js, Playwright, SQLite (`better-sqlite3`), TOML Config.

## 1. Architecture Overview

Aplikasi ini menggunakan pola **Micro-kernel / Plugin-based Architecture**.

- **Core (Kernel):** Menangani penjadwalan (Scheduler), antrian (Queue), manajemen resource (Browser Pool), logging, dan konektivitas eksternal.

- **Modules (Plugins):** Berisi logika bisnis spesifik (misal: Shopee Automation). Module bersifat _self-contained_ (punya tabel DB sendiri, state sendiri).

- **Database Strategy:** Dual-layer schema. Tabel sistem (`sys_*`) dikelola Core, tabel data (`module_*`) dikelola Module.

## 2. Core Components Specification

### A. Task Manager (The Orchestrator)

Komponen sentral yang mengatur eksekusi tugas.

- **Concurrency Control:** Membatasi jumlah **Task** yang berjalan paralel (bukan sekadar jumlah browser). Contoh: `MAX_CONCURRENT_TASKS = 5`.

- **Queue System:** Global FIFO Queue. Semua _One-Time Task_ dari module manapun masuk ke sini.

- **Browser/Context Injection Strategy:**
    1.  Saat Task diambil dari Queue, Task Manager mengecek metadata Task.

    2.  Jika Task membutuhkan browser, Task Manager mengecek apakah Instance Module pemilik task tersebut sudah memiliki _Active Browser Context_ (misal dari Loop Mode).

    3.  **Jika Ada:** Inject context tersebut ke fungsi task (`reuse`).

    4.  **Jika Tidak:** Spawn context baru -> Eksekusi -> Kill context.

- **Zombie Process Killer:** Mekanisme `Time-to-Live (TTL)` pada setiap eksekusi. Task yang macet melebihi batas waktu akan dipaksa berhenti (Kill PID/Context) dan ditandai `FAILED`.

### B. Module Interface (The Contract)

Setiap module adalah class yang mengimplementasikan interface standar.

- **Isolation:** Setiap instance module (misal: `shopee_toko_A` dan `shopee_toko_B`) memiliki ID unik dan file `storagestate.json` terpisah.

- **Modes:**
    1.  **Looping Mode:** Method `startLoop()`. Tidak masuk queue. Bisa melakukan fetch API ringan atau menjaga browser tetap terbuka (_Persistent Session_). Wajib mengimplementasikan _Recycle Logic_ (Restart browser tiap N iterasi).

    2.  **Task Mode:** Method `executeTask()`. Masuk queue. Menerima browser context dari Task Manager.

- **Data Persistence:** Module bertanggung jawab membuat tabel database-nya sendiri via method `setupSchema()`.

### C. Database Design (SQLite)

Menggunakan `better-sqlite3` untuk performa tinggi.

**Layer 1: System Tables (Managed by Core)**

- `sys_kv_store`: Key-Value untuk config dinamis/flag scheduler.

- `sys_tasks`: Antrian dan history task.
    - Cols: `id`, `module_instance_id`, `type`, `status`, `payload`, `created_at`.

- `sys_logs`: Log terpusat sebelum dikirim ke server eksternal.

**Layer 2: Module Tables (Managed by Module)**

- Contoh: `shopee_orders`
    - Cols: `order_sn`, `instance_id` (PK Composite), `status`, `data_json`.

    - **Aturan:** Wajib menyertakan `instance_id` pada setiap query untuk mencegah kebocoran data antar toko.

### D. Hybrid Session Management (The Logic)

Strategi sinkronisasi cookie antara HTTP Client (Impit/Got) dan Browser (Playwright).

1.  **SSOT:** File JSON (`storagestate.json`) adalah sumber kebenaran tunggal.

2.  **Login Flow:** Playwright Login -> Tangkap Cookie & `SPC_CDS_VER` -> Tulis ke JSON.

3.  **Fetch Flow:** Baca JSON -> Request API.
    - Jika Response ada header `Set-Cookie`: Update JSON saat itu juga (Write Atomic).

4.  **Task Flow:** Playwright `newContext({ storageState: 'path/to/json' })`. Ini menjamin browser selalu mendapat sesi terbaru hasil update dari Fetch.

### E. Scheduler & Event System

- **Scheduler:** Cron-based trigger yang tugasnya hanya satu: **Mendaftarkan Task ke Queue**. Tidak mengeksekusi langsung. Disimpan di SQLite agar persisten saat restart.

- **Global Event Bus:** Pattern Pub/Sub global.
    - Format Event: `MODULE_INSTANCE_ID:EVENT_NAME` (Contoh: `shopee_toko_a:ORDER_RECEIVED`).

    - Memungkinkan Module A men-trigger aksi di Module B.

### F. Configuration & External Access

- **Config File:** Format **TOML**.
    - Alasan: _Human-readable_, minim syntax error dibanding JSON/YAML.

    - Validasi: Menggunakan library `zod` saat startup. App menolak jalan jika config invalid.

- **Connector (WebSocket):**
    - Real-time control interface.

    - Security: Header Token Authentication sederhana.

    - Fitur: Trigger Task Manual, Live Log Streaming, Add Schedule.

## 3. Workflow Diagram (Logic Flow)

1.  **Startup:**

    `Load Config (TOML)` -> `Init DB` -> `Load Modules` -> `Module.setupSchema()` -> `Module.startLoop()`.

2.  **Monitoring Loop (Contoh Shopee):**

    `Module Loop` -> `Fetch API` -> _New Order?_ -> `Create Task Object` -> `Push to Global Queue`.

    _(Note: Jika Fetch menerima update cookie, file JSON langsung diupdate)._

3.  **Task Execution:**

    `Task Manager` -> _Ambil Task Teratas_ -> _Cek Limit Concurrency_ -> _Inject Browser Context (Reuse/New)_ -> `Module.executeTask()` -> `Update DB (sys_tasks)`.

---

Dokumen ini adalah acuan final untuk pengembangan fase pertama. Struktur ini menjamin _Scalability_ (mudah tambah module), _Reliability_ (state management & recovery), dan _Efficiency_ (hybrid resource usage).