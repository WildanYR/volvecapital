'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AlertCircle } from 'lucide-react'

export default function DisclaimerPage() {
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
            <AlertCircle className="size-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Important Notice</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Penyangkalan <span className="text-primary">(Disclaimer).</span></h1>
          <p className="text-gray-500 font-medium">Mohon baca informasi ini dengan saksama.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none space-y-8 text-gray-400"
        >
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">1. Hubungan dengan Penyedia Layanan</h2>
            <p>
              Volve Capital adalah platform mandiri yang menjual voucher layanan streaming. Kami **bukan** merupakan bagian dari, berafiliasi dengan, disponsori oleh, atau didukung oleh Netflix, Spotify, Disney+, YouTube, atau penyedia layanan streaming lainnya yang disebutkan di website ini. Semua nama merek, logo, dan hak cipta adalah milik dari masing-masing pemilik resminya.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">2. Ketersediaan Layanan</h2>
            <p>
              Meskipun kami berusaha keras untuk menjaga ketersediaan stok, kami tidak menjamin bahwa semua produk akan selalu tersedia setiap saat. Kami berhak mengubah harga, menghapus layanan, atau membatalkan pesanan jika terjadi kesalahan sistem atau gangguan pada penyedia layanan pusat.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">3. Kebijakan Pihak Ketiga</h2>
            <p>
              Setelah Anda menukarkan voucher atau menggunakan akun dari kami, Anda juga terikat oleh Syarat dan Ketentuan masing-masing penyedia layanan (misal: Syarat Penggunaan Netflix). Kami tidak bertanggung jawab jika akun Anda ditangguhkan oleh penyedia layanan akibat pelanggaran terhadap kebijakan mereka yang dilakukan oleh pengguna.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">4. Akurasi Informasi</h2>
            <p>
              Seluruh informasi di website ini disediakan "sebagaimana adanya" tanpa jaminan apa pun. Digital Premium berusaha memberikan deskripsi produk yang akurat, namun tidak bertanggung jawab atas kerugian yang timbul akibat kesalahan penulisan atau perubahan kebijakan mendadak dari penyedia layanan pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">5. Batasan Tanggung Jawab</h2>
            <p>
              Dalam keadaan apa pun, Digital Premium tidak bertanggung jawab atas kerugian tidak langsung, konsekuensial, atau khusus yang timbul dari penggunaan atau ketidakmampuan penggunaan layanan kami.
            </p>
          </section>

          <section className="pt-10 border-t border-white/5 text-center">
            <p className="text-sm italic">
              Dengan melanjutkan transaksi di Digital Premium, Anda dianggap telah memahami dan menyetujui seluruh poin dalam penyangkalan ini.
            </p>
          </section>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
