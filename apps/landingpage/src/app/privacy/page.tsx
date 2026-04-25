'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Lock } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#050505] text-white">
      <Navbar />
      
      <div className="pt-40 pb-20 px-6 container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Lock className="size-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Privacy Policy</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Kebijakan <span className="text-primary">Privasi.</span></h1>
          <p className="text-gray-500 font-medium">Privasi Anda adalah prioritas utama kami.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none space-y-8 text-gray-400"
        >
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi minimal yang diperlukan untuk memproses pesanan Anda:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Nama Lengkap (untuk identifikasi pesanan).</li>
              <li>Alamat Email (untuk pengiriman bukti transaksi dan voucher).</li>
              <li>Nomor WhatsApp (untuk pengiriman notifikasi instan dan bantuan CS).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">2. Penggunaan Informasi</h2>
            <p>
              Informasi yang Anda berikan digunakan secara eksklusif untuk:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Memproses transaksi pembayaran via Midtrans.</li>
              <li>Mengirimkan kode voucher layanan yang Anda beli.</li>
              <li>Memberikan bantuan teknis jika terjadi kendala pada pesanan.</li>
              <li>Informasi Anda tidak akan pernah kami jual atau bagikan kepada pihak ketiga untuk tujuan pemasaran tanpa izin Anda.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">3. Keamanan Data</h2>
            <p>
              Kami mengimplementasikan langkah-langkah keamanan teknis untuk melindungi data pribadi Anda dari akses yang tidak sah. Transaksi pembayaran diproses secara aman menggunakan enkripsi SSL melalui partner payment gateway kami yang terpercaya.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">4. Cookie</h2>
            <p>
              Website kami menggunakan cookie untuk menyimpan preferensi sesi Anda (seperti pilihan produk di keranjang) guna memberikan pengalaman pengguna yang lebih baik. Anda dapat menonaktifkan cookie melalui pengaturan browser Anda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">5. Perubahan Kebijakan</h2>
            <p>
              Volve Capital berhak memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan segera berlaku setelah dipublikasikan di halaman ini. Kami menyarankan Anda untuk memeriksa halaman ini secara berkala.
            </p>
          </section>

          <section className="pt-10 border-t border-white/5 text-center">
            <p className="text-sm">
              Dengan menggunakan layanan kami, Anda menyetujui praktik privasi yang dijelaskan di atas.
            </p>
          </section>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
