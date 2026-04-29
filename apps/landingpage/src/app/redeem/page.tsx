'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Check, ExternalLink, Loader2, Sparkles, Key, BookOpen } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return

    setIsLoading(true)
    setResult(null)
    try {
      const { data } = await api.get(`/public/voucher/${code}`)
      setResult(data)
      if (data?.voucher?.status === 'USED' && data?.voucher?.access_token) {
        setAccessToken(data.voucher.access_token)
        setTenantId(data.voucher.tenant_id)
      } else {
        setAccessToken(null)
        setTenantId(null)
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
      const { data } = await api.post('/public/voucher/redeem', { voucher_code: code })
      // Simpan access_token terpisah untuk portal link
      if (data.access_token) setAccessToken(data.access_token)
      if (data.tenant_id) setTenantId(data.tenant_id)
      setResult({ ...result, voucher: { ...result.voucher, status: 'USED' }, account: data })
      toast.success('Voucher berhasil diredeem!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal meredeem voucher')
    } finally {
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
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-6 mb-32">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-6"
          >
            <Key className="size-3 text-green-500" />
            <span className="text-[10px] font-black tracking-[0.3em] text-green-500 uppercase">Aktivasi Voucher</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Tukar <span className="text-primary">Kode Voucher.</span></h1>
          <p className="text-gray-400 text-lg">Masukkan kode voucher unik Anda untuk mendapatkan detail layanan seketika.</p>
        </div>

        <div className="glass-card rounded-[40px] p-8 md:p-12 border-white/5">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-gray-500" />
              <input 
                type="text"
                placeholder="VC-XXXXXXXX"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-xl font-black focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-gray-700 uppercase"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <button 
              disabled={isLoading}
              className="px-10 py-5 bg-gradient-gold text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shrink-0 text-sm uppercase tracking-widest shadow-lg"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Cek Sekarang'}
            </button>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-8 pt-10 border-t border-white/5"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h4 className="text-2xl md:text-3xl font-black text-white">{result?.voucher?.product_variant?.product?.name || 'Produk'}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold text-gray-500">{result?.voucher?.product_variant?.name || 'Varian'}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        result.voucher.status === 'USED' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {result.voucher.status === 'USED' ? 'Sudah Digunakan' : 'Siap Digunakan'}
                      </span>
                    </div>
                  </div>
                  
                  {result?.voucher?.status === 'UNUSED' && result?.voucher?.payment_status === 'PAID' && (
                    <button 
                      onClick={handleRedeem}
                      disabled={isLoading}
                      className="w-full md:w-auto px-10 py-4 bg-green-500 text-black font-black rounded-2xl hover:bg-green-400 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
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
                  
                  // Helper to resolve placeholders
                  const resolve = (val: string) => {
                    if (!val) return '';
                    let resolved = val
                      .replace(/\$\$email/g, result.account.email || '')
                      .replace(/\$\$password/g, result.account.password || '')
                      .replace(/\$\$profile/g, result.account.profile_name || '-')
                      .replace(/\$\$product/g, result.voucher.product_variant?.product?.name || '')
                      .replace(/\$\$expired/g, result.account.expired_at ? new Date(result.account.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
                    
                    // Resolve metadata placeholders: $$metadata.key
                    if (result.account.metadata) {
                      Object.entries(result.account.metadata).forEach(([key, value]) => {
                        const regex = new RegExp(`\\$\\$metadata\\.${key}`, 'g');
                        resolved = resolved.replace(regex, String(value || ''));
                      });
                    }
                    return resolved;
                  };

                  return (
                    <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 space-y-10 shadow-inner">
                      {/* Primary Fields: Email & Password */}
                      {(showEmail || showPassword) && (
                        <div className={cn(
                          "grid gap-8",
                          (showEmail && showPassword) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                        )}>
                          {showEmail && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Email / Username</label>
                              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5 group transition-all hover:border-primary/30">
                                <span className="text-base font-mono text-white truncate mr-4">{result.account.email}</span>
                                <button onClick={() => copyToClipboard(result.account.email)} className="text-primary hover:text-white transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {showPassword && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Password</label>
                              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5 group transition-all hover:border-primary/30">
                                <span className="text-base font-mono text-white truncate mr-4">{result.account.password}</span>
                                <button onClick={() => copyToClipboard(result.account.password)} className="text-primary hover:text-white transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Secondary Info: Profile & Expired */}
                      {(showProfile || showExpired) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {showProfile && (
                            <div className="flex items-center gap-4 bg-white/[0.03] px-6 py-4 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.05]">
                              <div className="bg-primary/20 p-2.5 rounded-xl">
                                <Check className="size-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Nama Profil</p>
                                <p className="text-base font-bold text-white">{result.account.profile_name || '-'}</p>
                              </div>
                            </div>
                          )}
                          {showExpired && (
                            <div className="flex items-center gap-4 bg-white/[0.03] px-6 py-4 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.05]">
                              <div className="bg-green-500/20 p-2.5 rounded-xl">
                                <Check className="size-5 text-green-500" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Masa Aktif</p>
                                <p className="text-base font-bold text-white">{new Date(result.account.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom Fields */}
                      {customFields.length > 0 && (
                        <div className={cn(
                          "grid gap-8",
                          customFields.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                        )}>
                          {customFields.map((field, idx) => (
                            <div key={idx} className="space-y-3">
                              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">{field.label}</label>
                              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5 group transition-all hover:border-primary/30">
                                <span className="text-base font-mono text-white truncate mr-4">{resolve(field.value)}</span>
                                <button onClick={() => copyToClipboard(resolve(field.value))} className="text-primary hover:text-white transition-colors shrink-0 p-1">
                                  <Copy className="size-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showInstruction && result.voucher.product_variant?.copy_template && (
                        <div className="mt-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 border-l-4 border-l-primary">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Instruksi Penggunaan</p>
                          <p className="text-sm text-gray-300 leading-relaxed font-medium italic">"{resolve(result.voucher.product_variant.copy_template)}"</p>
                        </div>
                      )}

                      {/* Buyer Portal Button */}
                      {showPortal && accessToken && (
                        <div className="mt-6 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-1">📧 Portal Email OTP</p>
                            <p className="text-sm text-gray-400">Pantau kode OTP & link reset Netflix akun Anda secara real-time.</p>
                          </div>
                          <a
                            href={`${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'}/portal/${tenantId || 'papapremium'}/${accessToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl transition-all flex items-center gap-2 text-sm shadow-[0_6px_20px_rgba(59,130,246,0.3)]"
                          >
                            <ExternalLink className="size-4" />
                            Akses Email Saya
                          </a>
                        </div>
                      )}

                      {/* Tutorial Link Button */}
                      {result.voucher?.product_variant?.tutorial?.slug && accessToken && (
                        <div className="mt-4 p-5 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">📖 Panduan Penggunaan</p>
                            <p className="text-sm text-gray-400">Ikuti langkah-langkah penggunaan agar akun Anda aman dan awet.</p>
                          </div>
                          <Link
                            href={`/tutorial/${result.voucher.product_variant.tutorial.slug}?token=${accessToken}&tenant=${tenantId || 'papapremium'}`}
                            className="shrink-0 px-6 py-3 bg-primary text-black hover:bg-primary/90 font-black rounded-xl transition-all flex items-center gap-2 text-sm shadow-[0_6px_20px_rgba(255,184,0,0.3)]"
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
