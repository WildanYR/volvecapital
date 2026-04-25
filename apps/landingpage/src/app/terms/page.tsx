'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ShieldCheck } from 'lucide-react'

export default function TermsPage() {
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
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Legal Document</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Syarat & <span className="text-primary">Ketentuan.</span></h1>
          <p className="text-gray-500 font-medium">Terakhir diperbarui: 26 April 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none space-y-8 text-gray-400"
        >
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan layanan Volve Capital, Anda dianggap telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian apa pun dari ketentuan ini, Anda tidak diperbolehkan menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">2. Deskripsi Layanan</h2>
            <p>
              Volve Capital menyediakan platform penjualan voucher untuk layanan streaming premium (seperti Netflix, Spotify, Disney+, dll). Kami bertindak sebagai perantara penyedia layanan dan tidak memiliki afiliasi resmi dengan merek-merek tersebut kecuali dinyatakan lain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">3. Akun dan Keamanan</h2>
            <p>
              Beberapa layanan mengharuskan Anda memberikan informasi kontak yang akurat (Email & WhatsApp). Anda bertanggung jawab penuh atas kerahasiaan data voucher yang telah dikirimkan kepada Anda. Volve Capital tidak bertanggung jawab atas penyalahgunaan voucher akibat kelalaian pengguna.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">4. Pembayaran dan Pengembalian Dana</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Semua transaksi dilakukan melalui gerbang pembayaran resmi (Midtrans).</li>
              <li>Voucher akan dikirimkan secara otomatis setelah pembayaran terverifikasi sukses.</li>
              <li>Refund (pengembalian dana) hanya dapat diproses jika sistem kami gagal mengirimkan kode voucher dalam waktu 1x24 jam atau jika voucher yang dikirimkan terbukti tidak valid sejak awal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">5. Larangan Penggunaan</h2>
            <p>
              Dilarang keras menggunakan voucher kami untuk tujuan ilegal, penipuan, atau aktivitas yang melanggar hukum di wilayah Republik Indonesia. Kami berhak membatalkan pesanan jika ditemukan indikasi kecurangan.
            </p>
          </section>

          <section className="pt-10 border-t border-white/5">
            <p className="text-sm italic">
              Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi tim bantuan kami melalui WhatsApp yang tertera di website.
            </p>
          </section>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
