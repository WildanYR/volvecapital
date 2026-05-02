'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ShieldCheck } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-[#0f172a]">
      <Navbar />
      
      <div className="pt-40 pb-32 px-6 container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6">
            <ShieldCheck className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-[#f97316] uppercase">Dokumen Legal</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-[#0f172a]">
            Syarat & <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Ketentuan.</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Terakhir diperbarui: 2 Mei 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-12"
        >
          <section className="p-8 md:p-12 bg-slate-50/50 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#f97316] font-black text-sm">01</span>
              Penerimaan Ketentuan
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg">
              Dengan mengakses dan menggunakan layanan kami, Anda dianggap telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian apa pun dari ketentuan ini, Anda tidak diperbolehkan menggunakan layanan kami.
            </p>
          </section>

          <section className="p-8 md:p-12 bg-white rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f97316] font-black text-sm">02</span>
              Deskripsi Layanan
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg">
              Kami menyediakan platform penjualan voucher untuk layanan streaming premium (seperti Netflix, Spotify, Disney+, dll). Kami bertindak sebagai perantara penyedia layanan dan tidak memiliki afiliasi resmi dengan merek-merek tersebut kecuali dinyatakan lain.
            </p>
          </section>

          <section className="p-8 md:p-12 bg-slate-50/50 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#f97316] font-black text-sm">03</span>
              Akun dan Keamanan
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg">
              Beberapa layanan mengharuskan Anda memberikan informasi kontak yang akurat (Email & WhatsApp). Anda bertanggung jawab penuh atas kerahasiaan data voucher yang telah dikirimkan kepada Anda. Kami tidak bertanggung jawab atas penyalahgunaan voucher akibat kelalaian pengguna.
            </p>
          </section>

          <section className="p-8 md:p-12 bg-white rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f97316] font-black text-sm">04</span>
              Pembayaran & Refund
            </h2>
            <ul className="space-y-4">
              {[
                'Semua transaksi dilakukan melalui gerbang pembayaran resmi.',
                'Voucher akan dikirimkan secara otomatis setelah pembayaran terverifikasi.',
                'Refund hanya diproses jika sistem gagal mengirimkan kode voucher dalam waktu 1x24 jam.'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-600 font-medium text-lg">
                  <div className="size-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-bold italic">
              Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi tim bantuan kami melalui WhatsApp.
            </p>
          </section>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
