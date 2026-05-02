'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Lock } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-[#0f172a]">
      <Navbar />
      
      <div className="pt-40 pb-32 px-6 container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
            <Lock className="size-4 text-emerald-600" />
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase">Privasi Aman</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-[#0f172a]">
            Kebijakan <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Privasi.</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Data Anda adalah prioritas utama kami</p>
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
              Informasi yang Dikumpulkan
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg mb-6">
              Kami mengumpulkan informasi minimal yang diperlukan untuk memproses pesanan Anda:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Nama Lengkap', 'Alamat Email', 'Nomor WhatsApp'].map((item, i) => (
                <div key={i} className="px-6 py-4 bg-white rounded-2xl border border-slate-200 text-[#0f172a] font-bold text-center text-sm shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="p-8 md:p-12 bg-white rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f97316] font-black text-sm">02</span>
              Penggunaan Informasi
            </h2>
            <ul className="space-y-4">
              {[
                'Memproses transaksi pembayaran secara aman.',
                'Mengirimkan kode voucher layanan secara otomatis.',
                'Memberikan bantuan teknis jika terjadi kendala.',
                'Data Anda tidak akan pernah kami bagikan ke pihak ketiga.'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-600 font-medium text-lg">
                  <div className="size-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-1.5 rounded-full bg-[#f97316]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="p-8 md:p-12 bg-slate-50/50 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-6 flex items-center gap-4">
              <span className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#f97316] font-black text-sm">03</span>
              Keamanan Data
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg">
              Kami mengimplementasikan langkah-langkah keamanan teknis untuk melindungi data pribadi Anda. Transaksi pembayaran diproses secara aman menggunakan enkripsi SSL melalui partner payment gateway kami yang terpercaya.
            </p>
          </section>

          <section className="pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-bold italic">
              Dengan menggunakan layanan kami, Anda menyetujui seluruh praktik privasi yang dijelaskan di atas.
            </p>
          </section>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
