saya mau semua user bisa mengcustomize semua yang tampil di landing page mereka, 


# Hero Section
- **Judul Utama**: Teks besar di tengah (misal: "Akses Layanan Premium Seketika.")
- **Subjudul**: Teks kecil di bawah judul (misal: "Dapatkan akses instan ke hiburan favoritmu.")
- **Tombol 1 (Teks & Warna)**: Teks & Warna tombol utama (misal: "Mulai Berlangganan")
- **Tombol 2 (Teks & Warna)**: Teks & Warna tombol kedua (misal: "Tukarkan Voucher")
- **Badge/Label**: Teks kecil di atas judul (misal: "Sistem Voucher Otomatis 24/7")
- **Mode**: Tampilkan / Sembunyikan badge, CTAs, Social Proof
- **social proof**: bisa edit dan menambahkannya misal   <Users className="size-5 text-primary" />
                2.000+ dan <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pelanggan Aktif</span>
pokoknya bisa ngedit bagian dan bisa hapus atau nambahin social prof nya

# produk-grid section
- **Judul Utama**: Teks besar di tengah (misal: "Pilihan Terpopuler")
- **H2**:  <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Paket <span className="text-primary">Unggulan Kami.</span></h2>

<p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Dapatkan akses instan ke layanan premium terbaik dengan harga yang paling kompetitif di pasar.
          </p>
di produk section pokok nya user bisa edit bagian itu ya

# features
[
    {
      icon: UserMinus,
      title: "Tanpa Login",
      description: "Beli voucher tanpa perlu membuat akun. Cukup masukkan email/WA."
    },
    {
      icon: Zap,
      title: "Proses Instan",
      description: "Voucher otomatis terkirim sesaat setelah pembayaran terkonfirmasi."
    },
    {
      icon: CreditCard,
      title: "Pembayaran Lengkap",
      description: "Mendukung QRIS, Virtual Account, dan berbagai metode lainnya."
    },
    {
      icon: Clock,
      title: "Aktif 24/7",
      description: "Sistem kami bekerja otomatis setiap saat, bahkan di hari libur."
    },
    {
      icon: MessageCircle,
      title: "Support WhatsApp",
      description: "Tim bantuan kami siap membantu jika Anda mengalami kendala."
    },
    {
      icon: ShieldCheck,
      title: "Legal & Bergaransi",
      description: "Semua produk adalah legal dan kami memberikan garansi penuh."
    }
  ]

  bisa dedit icon,tittle,description
pokoknya user bisa ngedit itu atau hapus/nambahin itu juga ya

# testimonial
[
  {
    name: "Andi Pratama",
    role: "Pecinta Film",
    content: "Sumpah cepet banget! Bayar pake QRIS, langsung dapet WA kode vouchernya. Netflix 4K nya jernih parah.",
    stars: 5,
    initial: "A"
  },
  {
    name: "Siska Amelia",
    role: "Mahasiswi",
    content: "Spotify Premium termurah yang pernah saya beli. Udah 3 bulan aman terus, gak pernah back to free. Trusted!",
    stars: 5,
    initial: "S"
  },
  {
    name: "Budi Raharjo",
    role: "Bapak Rumah Tangga",
    content: "Disney+ buat anak-anak jadi gampang belinya. Proses redeemnya simple banget buat saya yang gaptek.",
    stars: 5,
    initial: "B"
  },
  {
    name: "Rina Wijaya",
    role: "Freelancer",
    content: "Pelayanan mantap, adminnya responsif banget pas ditanya-tanya via WhatsApp. Sangat recommended buat yang cari akun legal.",
    stars: 5,
    initial: "R"
  }
]
saya mau user bisa edit nama,role,content,stars,initial, bisa hapus dan nambahin juga

# Faq section
ini belum ada di component landingpage saya tolong buatkan sekalian ya, nanti nya user bisa edit dan memambahkan Faq nya juga contoh : 8. FAQ Section
    list: ['Apa benefit utama bergabung di Shopee Ads Mastery?', 'Apakah materi ini cocok untuk pemula yang belum pernah iklan?', 'Berapa lama akses akses materi saya setelah bergabung?', 'Apakah saya akan mendapatkan update jika ada perubahan algoritma Shopee?', 'Bagaimana jika saya merasa tidak cocok setelah bergabung?', 'Apakah saya bisa mengajukan pengembalian dana (refund)?'],

tolong Faq nya disesuaikan dengan produk ku ya 

# navbar
bisa edit text logo,navigasi nya juga bisa di edit, ada fitur untuk mengaktifkan dan menonaktifkan halaman produk dan halaman redeem, atau namabhin link navigasi sendiri, aktifkan by default 

# footer
bisa edit alamat,email, social media
doclink


semuanya bisa di setting di admin dashboard ya http://localhost:3000/dashboard/setting