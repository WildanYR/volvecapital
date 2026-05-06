'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Check, ExternalLink, Loader2, Sparkles, Key, BookOpen } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EmailPortal } from '@/components/email-portal'
import Link from 'next/link'
import { useTenant } from '@/hooks/use-tenant'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { tenantId } = useTenant()

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!code) return

    setIsLoading(true)
    setResult(null)
    try {
      const { data } = await api.get(`/public/voucher/${code}`)
      setResult(data)
      if (data?.voucher?.status === 'USED' && data?.voucher?.access_token) {
        setAccessToken(data.voucher.access_token)
      } else {
        setAccessToken(null)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kode voucher tidak ditemukan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = async () => {
    setIsLoading(true)
    try {
      await api.post('/public/voucher/redeem', { voucher_code: code })
      toast.success('Voucher berhasil diredeem!')
      // Refresh data after success to ensure we have the full, parsed account object
      await handleSearch()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal meredeem voucher')
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Disalin ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen flex flex-col pt-40 pb-0 bg-white">
      <Navbar />
      
      <div className="flex-grow container mx-auto max-w-4xl px-6 mb-32">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6"
          >
            <Key className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-[#f97316] uppercase">Aktivasi Voucher</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 text-[#0f172a] tracking-tight">Tukar <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Kode Voucher.</span></h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Masukkan kode voucher unik Anda untuk mendapatkan detail layanan seketika.</p>
        </div>

        <div className="bg-white rounded-[48px] p-8 md:p-14 border border-slate-100 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-12 relative z-10">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-slate-400" />
              <input 
                type="text"
                placeholder="VC-XXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-5 text-xl font-black focus:outline-none focus:border-[#f97316] transition-all text-[#0f172a] placeholder:text-slate-300 uppercase"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <button 
              disabled={isLoading}
              className="px-10 py-5 bg-[#0f172a] text-white font-black rounded-2xl hover:bg-gradient-to-br hover:from-[#f97316] hover:to-[#ef4444] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shrink-0 text-sm uppercase tracking-widest shadow-xl"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Cek Sekarang'}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-10 pt-12 border-t border-slate-100 relative z-10"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h4 className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight">{result?.voucher?.product_variant?.product?.name || 'Produk'}</h4>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{result?.voucher?.product_variant?.name || 'Varian'}</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase ${
                        result.voucher.status === 'USED' 
                        ? 'bg-red-50 text-red-500 border border-red-100' 
                        : result.voucher.status === 'PENDING'
                        ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                        : result.voucher.status === 'EXPIRED'
                        ? 'bg-slate-50 text-slate-500 border border-slate-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {result.voucher.status === 'USED' 
                          ? 'Sudah Digunakan' 
                          : result.voucher.status === 'PENDING'
                          ? 'Belum Dibayar'
                          : result.voucher.status === 'EXPIRED'
                          ? 'Kadaluarsa'
                          : 'Siap Digunakan'}
                      </span>
                    </div>
                  </div>
                  
                  {result?.voucher?.status === 'UNUSED' && result?.voucher?.payment_status === 'PAID' && (
                    <button 
                      onClick={handleRedeem}
                      disabled={isLoading}
                      className="w-full md:w-auto px-12 py-5 bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(249,115,22,0.3)]"
                    >
                      {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Aktivasi Sekarang'}
                    </button>
                  )}
                </div>

                {result.account && (() => {
                  const displayConfig = result.voucher.product_variant?.redeem_display_config;
                  const showEmail = displayConfig?.show_email ?? true;
                  const showPassword = displayConfig?.show_password ?? true;
                  const showProfile = displayConfig?.show_profile_name ?? true;
                  const showExpired = displayConfig?.show_expired_at ?? true;
                  const showInstruction = displayConfig?.show_copy_template ?? true;
                  const showPortal = displayConfig?.show_buyer_portal ?? true;
                  const customFields = (displayConfig?.custom_fields ?? []) as { label: string; value: string }[];
                  
                  const resolve = (val: string) => {
                    if (!val) return '';
                    let resolved = val
                      .replace(/\$\$email/g, result.account.email || '')
                      .replace(/\$\$password/g, result.account.password || '')
                      .replace(/\$\$profile/g, result.account.profile_name || '-')
                      .replace(/\$\$product/g, result.voucher.product_variant?.product?.name || '')
                      .replace(/\$\$expired/g, result.account.expired_at ? new Date(result.account.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
                    
                    if (result.account.metadata) {
                      let metaObj = result.account.metadata;
                      // Handle case where metadata might be a JSON string
                      if (typeof metaObj === 'string') {
                        try { metaObj = JSON.parse(metaObj) } catch(e) {}
                      }

                      if (typeof metaObj === 'object' && metaObj !== null) {
                        Object.entries(metaObj).forEach(([key, value]) => {
                          const regex = new RegExp(`\\$\\$metadata\\.${key}`, 'g');
                          resolved = resolved.replace(regex, String(value || ''));
                        });
                      }
                    }
                    return resolved;
                  };

                  return (
                    <div className="space-y-10">
                      {(showEmail || showPassword) && (
                        <div className={cn(
                          "grid gap-8",
                          (showEmail && showPassword) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                        )}>
                          {showEmail && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Email / Username</label>
                              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 group transition-all hover:border-[#f97316]">
                                <span className="text-base font-mono text-[#0f172a] font-bold break-all mr-4">{result.account.email}</span>
                                <button onClick={() => copyToClipboard(result.account.email)} className="text-[#f97316] hover:text-[#ef4444] transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {showPassword && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Password</label>
                              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 group transition-all hover:border-[#f97316]">
                                <span className="text-base font-mono text-[#0f172a] font-bold break-all mr-4">{result.account.password}</span>
                                <button onClick={() => copyToClipboard(result.account.password)} className="text-[#f97316] hover:text-[#ef4444] transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {(showProfile || showExpired) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {showProfile && (
                            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200">
                              <div className="bg-orange-50 p-2.5 rounded-xl">
                                <Check className="size-5 text-[#f97316]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nama Profil</p>
                                <p className="text-base font-black text-[#0f172a]">{result.account.profile_name || '-'}</p>
                              </div>
                            </div>
                          )}
                          {showExpired && (
                            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200">
                              <div className="bg-emerald-50 p-2.5 rounded-xl">
                                <Check className="size-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Masa Aktif</p>
                                <p className="text-base font-black text-[#0f172a]">{new Date(result.account.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {customFields.length > 0 && (
                        <div className={cn(
                          "grid gap-8",
                          customFields.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                        )}>
                          {customFields.map((field, idx) => (
                            <div key={idx} className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">{field.label}</label>
                              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 group transition-all hover:border-[#f97316]">
                                <span className="text-base font-mono text-[#0f172a] font-bold break-all mr-4">{resolve(field.value)}</span>
                                <button onClick={() => copyToClipboard(resolve(field.value))} className="text-[#f97316] hover:text-[#ef4444] transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showInstruction && result.voucher.product_variant?.copy_template && (
                        <div className="mt-4 p-8 bg-orange-50 rounded-[32px] border border-orange-100 border-l-8 border-l-[#f97316]">
                          <p className="text-xs font-black text-[#f97316] uppercase tracking-[0.2em] mb-3">Instruksi Penggunaan</p>
                          <p className="text-base text-slate-600 leading-relaxed font-bold italic">"{resolve(result.voucher.product_variant.copy_template)}"</p>
                        </div>
                      )}

                      {showPortal && accessToken && (
                        <div className="mt-6">
                          <EmailPortal token={accessToken} />
                        </div>
                      )}

                      {result.voucher?.product_variant?.tutorial?.slug && accessToken && (
                        <div className="mt-4 p-6 bg-slate-900 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                            <p className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] mb-1">📖 Panduan Penggunaan</p>
                            <p className="text-sm text-slate-400 font-medium">Ikuti langkah-langkah penggunaan agar akun Anda aman dan awet.</p>
                          </div>
                          <Link
                            href={`/tutorial/${result.voucher.product_variant.tutorial.slug}?token=${accessToken}&tenant=${tenantId || 'master'}`}
                            className="shrink-0 px-8 py-4 bg-white text-[#0f172a] hover:bg-orange-500 hover:text-white font-black rounded-2xl transition-all flex items-center gap-2 text-sm shadow-lg"
                          >
                            <BookOpen className="size-4" />
                            Lihat Panduan
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  )
}
