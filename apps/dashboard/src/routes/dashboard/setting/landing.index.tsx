import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  LayoutTemplate, 
  Megaphone, 
  MessageSquare, 
  HelpCircle, 
  Navigation, 
  Type,
  ArrowLeft,
  ShieldCheck,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { Switch } from '@/dashboard/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/dashboard/components/ui/alert-dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { SettingServiceGenerator } from '@/dashboard/services/setting.service'
import { Link } from '@tanstack/react-router'
import type { 
  LandingHeroConfig, 
  LandingFeatureConfig,
  LandingTestimonialItem, 
  LandingFaqItem, 
  LandingNavbarConfig, 
  LandingFooterConfig 
} from '@volvecapital/shared/types'

export const Route = createFileRoute('/dashboard/setting/landing/')({
  component: LandingSettingPage,
})

function LandingSettingPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const settingService = SettingServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingService.getSettings(),
  })

  // State for each section
  const [hero, setHero] = useState<LandingHeroConfig>({
    badge: 'Sistem Voucher Otomatis 24/7',
    title: 'Akses Layanan Premium Seketika.',
    subtitle: 'Dapatkan akses instan ke hiburan favoritmu.',
    button1Text: 'Mulai Berlangganan',
    button2Text: 'Tukarkan Voucher',
    showBadge: true,
    showCTAs: true,
    showSocialProof: true,
    socialProofItems: [
      { id: '1', number: '2.000+', label: 'Pelanggan Aktif', iconEmbed: '' }
    ],
    backgroundImageUrl: '',
  })

  const [features, setFeatures] = useState<LandingFeatureConfig>({
    sectionTitle: 'Kenapa Memilih Volve Capital?',
    items: []
  })
  const [testimonials, setTestimonials] = useState<LandingTestimonialItem[]>([])
  const [faqs, setFaqs] = useState<LandingFaqItem[]>([])
  const [navbar, setNavbar] = useState<LandingNavbarConfig>({
    logoText: 'VolveCapital',
    logoIconEmbed: '',
    showProducts: true,
    showRedeem: true,
    links: [{ label: 'Tutorial', href: '/tutorial' }],
  })
  const [footer, setFooter] = useState<LandingFooterConfig>({
    address: 'Indonesia',
    email: 'support@volvecapital.com',
    socialLinks: [],
    docLinks: [],
  })
  const [themeCss, setThemeCss] = useState('')
  const [siteTitle, setSiteTitle] = useState('Digital Premium')
  const [siteDescription, setSiteDescription] = useState('Premium Streaming Voucher System')
  const [siteFavicon, setSiteFavicon] = useState('/favicon.ico')
  const [customDomain, setCustomDomain] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleDisconnectDomain = () => {
    setCustomDomain('')
    const payload = {
      CUSTOM_DOMAIN: '',
      SITE_TITLE: siteTitle,
      SITE_DESCRIPTION: siteDescription,
      SITE_FAVICON: siteFavicon,
      LANDING_HERO: JSON.stringify(hero),
      LANDING_FEATURES: JSON.stringify(features),
      LANDING_TESTIMONIALS: JSON.stringify(testimonials),
      LANDING_FAQ: JSON.stringify(faqs),
      LANDING_NAVBAR: JSON.stringify(navbar),
      LANDING_FOOTER: JSON.stringify(footer),
      LANDING_THEME_CSS: themeCss,
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Domain kustom berhasil dicopot!')
        setIsConfirmOpen(false)
      }
    })
  }

  useEffect(() => {
    if (settings) {
      if (settings.LANDING_HERO) {
        const parsed = JSON.parse(settings.LANDING_HERO)
        // Migration logic for array
        if (!parsed.socialProofItems) {
          if (parsed.socialProofNumber) {
            parsed.socialProofItems = [{
              id: '1',
              number: parsed.socialProofNumber,
              label: parsed.socialProofLabel || '',
              iconEmbed: parsed.socialProofIconEmbed || ''
            }]
          } else if (parsed.socialProofText) {
            const parts = parsed.socialProofText.split(' ')
            parsed.socialProofItems = [{
              id: '1',
              number: parts[0],
              label: parts.slice(1).join(' '),
              iconEmbed: ''
            }]
          } else {
            parsed.socialProofItems = []
          }
          delete parsed.socialProofNumber
          delete parsed.socialProofLabel
          delete parsed.socialProofIconEmbed
          delete parsed.socialProofText
        }
        setHero(parsed)
      }
      if (settings.LANDING_FEATURES) {
        const parsed = JSON.parse(settings.LANDING_FEATURES)
        if (Array.isArray(parsed)) {
          setFeatures({ sectionTitle: 'Kenapa Memilih Volve Capital?', items: parsed })
        } else {
          setFeatures(parsed)
        }
      }
      if (settings.SITE_TITLE) setSiteTitle(settings.SITE_TITLE)
      if (settings.SITE_DESCRIPTION) setSiteDescription(settings.SITE_DESCRIPTION)
      if (settings.SITE_FAVICON) setSiteFavicon(settings.SITE_FAVICON)
      if (settings.CUSTOM_DOMAIN) setCustomDomain(settings.CUSTOM_DOMAIN)
      if (settings.LANDING_TESTIMONIALS) setTestimonials(JSON.parse(settings.LANDING_TESTIMONIALS))
      if (settings.LANDING_FAQ) setFaqs(JSON.parse(settings.LANDING_FAQ))
      if (settings.LANDING_NAVBAR) setNavbar(JSON.parse(settings.LANDING_NAVBAR))
      if (settings.LANDING_FOOTER) setFooter(JSON.parse(settings.LANDING_FOOTER))
      if (settings.LANDING_THEME_CSS) setThemeCss(settings.LANDING_THEME_CSS)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (newSettings: Record<string, string>) => settingService.updateBulkSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan landing page berhasil disimpan.')
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`)
    },
  })

  const handleSave = () => {
    const payload = {
      CUSTOM_DOMAIN: customDomain.trim().toLowerCase(),
      SITE_TITLE: siteTitle,
      SITE_DESCRIPTION: siteDescription,
      SITE_FAVICON: siteFavicon,
      LANDING_HERO: JSON.stringify(hero),
      LANDING_FEATURES: JSON.stringify(features),
      LANDING_TESTIMONIALS: JSON.stringify(testimonials),
      LANDING_FAQ: JSON.stringify(faqs),
      LANDING_NAVBAR: JSON.stringify(navbar),
      LANDING_FOOTER: JSON.stringify(footer),
      LANDING_THEME_CSS: themeCss,
    }
    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link to="/dashboard/setting" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Kustomisasi Landing Page</h1>
          </div>
          <p className="text-muted-foreground">Sesuaikan tampilan halaman depan website Anda.</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg" className="shadow-lg">
          {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Simpan Semua Perubahan
        </Button>
      </div>

      <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-8 w-full" orientation="vertical">
        <TabsList className="flex flex-col w-full md:w-56 shrink-0 gap-2 bg-transparent p-0 h-auto md:sticky md:top-24 md:self-start">
          <TabsTrigger value="general" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Umum & SEO</TabsTrigger>
          <TabsTrigger value="hero" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Hero</TabsTrigger>
          <TabsTrigger value="social-proof" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Social Proof</TabsTrigger>
          <TabsTrigger value="features" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Fitur</TabsTrigger>
          <TabsTrigger value="testimonials" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Testimoni</TabsTrigger>
          <TabsTrigger value="faq" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">FAQ</TabsTrigger>
          <TabsTrigger value="navfoot" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Nav & Footer</TabsTrigger>
          <TabsTrigger value="theme" className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10 px-4">Theme</TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full min-w-0">
          {/* GENERAL / SEO SECTION */}
          <TabsContent value="general" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  Pengaturan Umum & SEO
                </CardTitle>
                <CardDescription>Sesuaikan judul tab browser, favicon, dan deskripsi SEO situs Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Judul Situs (Site Title)</Label>
                  <Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} placeholder="Contoh: Paytronik — Premium Store" />
                  <p className="text-[10px] text-muted-foreground italic">* Teks ini akan muncul di judul tab browser pengunjung Anda.</p>
                </div>

                <div className="space-y-2">
                  <Label>Favicon URL (Ikon Tab Browser)</Label>
                  <Input value={siteFavicon} onChange={e => setSiteFavicon(e.target.value)} placeholder="Contoh: https://example.com/favicon.png" />
                  <p className="text-[10px] text-muted-foreground italic">* URL gambar ikon kecil yang muncul di sebelah kiri judul tab browser (format PNG/ICO recommended).</p>
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi SEO (Site Description)</Label>
                  <Textarea value={siteDescription} onChange={e => setSiteDescription(e.target.value)} placeholder="Dapatkan voucher streaming instan 24 jam dengan harga terjangkau." />
                  <p className="text-[10px] text-muted-foreground italic">* Deskripsi yang akan muncul saat link website Anda dibagikan di WhatsApp, Google, atau sosial media.</p>
                </div>

                {/* Custom Domain Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                      🌐 Pengaturan Kustom Domain (Opsional)
                    </h3>
                    
                    {settings?.CUSTOM_DOMAIN && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Domain Aktif Terpasang
                      </span>
                    )}
                  </div>

                  {settings?.CUSTOM_DOMAIN ? (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Domain Terhubung</p>
                          <a 
                            href={`https://${settings.CUSTOM_DOMAIN}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm font-bold text-primary hover:underline hover:text-emerald-500 transition-colors"
                          >
                            https://{settings.CUSTOM_DOMAIN}
                          </a>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 text-xs font-bold px-3 shrink-0"
                          onClick={() => setIsConfirmOpen(true)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Trash2 className="size-3.5 mr-1" />}
                          Copot Domain
                        </Button>
                      </div>

                      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin mencopot domain kustom ini? Halaman toko premium Anda akan kembali menggunakan subdomain bawaan (<span className="font-semibold text-primary">{auth.tenant!.id}.digitalpremium.id</span>).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel disabled={updateMutation.isPending} onClick={() => setIsConfirmOpen(false)}>
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              disabled={updateMutation.isPending}
                              onClick={(e) => {
                                e.preventDefault()
                                handleDisconnectDomain()
                              }}
                            >
                              {updateMutation.isPending ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin mr-1" />
                                  Mencopot...
                                </>
                              ) : (
                                'Ya, Copot Domain'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Domain Kustom Anda</Label>
                      <Input
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="Contoh: digitalpremium.id"
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        * Biarkan kosong jika ingin menggunakan domain bawaan ({auth.tenant!.id}.digitalpremium.id).
                      </p>
                    </div>
                  )}

                  {/* Alert Box Panduan DNS */}
                  <div className="p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg space-y-2 text-xs">
                    <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      💡 Panduan Menghubungkan Domain Kustom
                    </span>
                    <p className="text-muted-foreground">
                      Agar domain kustom Anda dapat terhubung ke toko premium Anda, silakan ubah pengaturan DNS di penyedia domain Anda (Niagahoster, Domainesia, GoDaddy, dll):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                      <li>
                        <strong>Rekomendasi (Cloudflare):</strong> Daftarkan domain di Cloudflare gratis, buat record <strong>CNAME</strong> dengan name <code className="bg-muted px-1 rounded">@</code> mengarah ke <code className="bg-muted px-1 rounded">cname.digitalpremium.id</code> dengan <strong>Proxy Status (Awan Oranye) Aktif</strong>.
                      </li>
                      <li>
                        <strong>Alternatif (A-Record):</strong> Tambahkan record <strong>A</strong> dengan name <code className="bg-muted px-1 rounded">@</code> mengarah ke IP Server VPS: <code className="bg-muted px-1 rounded">103.183.74.146</code>.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HERO SECTION */}
          <TabsContent value="hero" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="size-5 text-primary" />
                Hero Section
              </CardTitle>
              <CardDescription>Bagian utama yang pertama kali dilihat pengunjung.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Badge Teks</Label>
                  <Input value={hero.badge} onChange={e => setHero({...hero, badge: e.target.value})} placeholder="Sistem Voucher Otomatis" />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch checked={hero.showBadge} onCheckedChange={v => setHero({...hero, showBadge: v})} />
                  <Label>Tampilkan Badge</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Judul Utama (H1)</Label>
                <Input value={hero.title} onChange={e => setHero({...hero, title: e.target.value})} placeholder="Akses Layanan Premium Seketika." />
              </div>

              <div className="space-y-2">
                <Label>Subjudul</Label>
                <Textarea value={hero.subtitle} onChange={e => setHero({...hero, subtitle: e.target.value})} placeholder="Deskripsi singkat layanan Anda." />
              </div>
              
              <div className="space-y-2">
                <Label>Hero Background Image URL (Embed Link)</Label>
                <Input 
                  value={hero.backgroundImageUrl} 
                  onChange={e => setHero({...hero, backgroundImageUrl: e.target.value})} 
                  placeholder="https://example.com/hero-bg.jpg" 
                />
                <p className="text-[10px] text-muted-foreground italic">* Kosongkan untuk menggunakan background default (gelap).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                <div className="space-y-2">
                  <Label>Tombol 1 (Teks)</Label>
                  <Input value={hero.button1Text} onChange={e => setHero({...hero, button1Text: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tombol 2 (Teks)</Label>
                  <Input value={hero.button2Text} onChange={e => setHero({...hero, button2Text: e.target.value})} />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL PROOF SECTION */}
        <TabsContent value="social-proof" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Social Proof Settings
              </CardTitle>
              <CardDescription>Tampilkan angka kepercayaan pelanggan di bawah Hero Section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center space-x-2">
                  <Switch checked={hero.showSocialProof} onCheckedChange={v => setHero({...hero, showSocialProof: v})} />
                  <Label>Tampilkan Social Proof</Label>
                </div>
                {hero.showSocialProof && (
                  <Button size="sm" variant="outline" onClick={() => setHero({ ...hero, socialProofItems: [...hero.socialProofItems, { id: crypto.randomUUID(), number: '', label: '', iconEmbed: '' }] })}>
                    <Plus className="size-4 mr-2" /> Tambah Item
                  </Button>
                )}
              </div>
              
              {hero.showSocialProof && (
                <div className="space-y-4">
                  {hero.socialProofItems.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-card relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setHero({ ...hero, socialProofItems: hero.socialProofItems.filter(i => i.id !== item.id) })}>
                        <Trash2 className="size-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Angka (e.g. 2.000+)</Label>
                          <Input value={item.number} onChange={e => {
                            const newItems = [...hero.socialProofItems]
                            newItems[index].number = e.target.value
                            setHero({ ...hero, socialProofItems: newItems })
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label>Label (e.g. Pelanggan Aktif)</Label>
                          <Input value={item.label} onChange={e => {
                            const newItems = [...hero.socialProofItems]
                            newItems[index].label = e.target.value
                            setHero({ ...hero, socialProofItems: newItems })
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon Embed (SVG/Link)</Label>
                          <Input value={item.iconEmbed} onChange={e => {
                            const newItems = [...hero.socialProofItems]
                            newItems[index].iconEmbed = e.target.value
                            setHero({ ...hero, socialProofItems: newItems })
                          }} placeholder="<svg>...</svg> or link" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {hero.showSocialProof && hero.socialProofItems.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                  Belum ada item Social Proof. Klik "Tambah Item" untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURES SECTION */}
        <TabsContent value="features" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="size-5 text-primary" />
                  Fitur Unggulan
                </CardTitle>
                <CardDescription>Daftar kelebihan layanan Anda.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setFeatures({ ...features, items: [...features.items, { id: crypto.randomUUID(), title: '', description: '', iconEmbed: '' }] })}>
                <Plus className="size-4 mr-2" /> Tambah Fitur
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 border-b pb-6">
                <Label>Judul Section (Gunakan spasi untuk memisahkan warna Putih & Kuning)</Label>
                <Input 
                  value={features.sectionTitle} 
                  onChange={e => setFeatures({ ...features, sectionTitle: e.target.value })} 
                  placeholder="Kenapa Memilih Volve Capital?"
                />
                <p className="text-[10px] text-muted-foreground italic">* Kata terakhir akan otomatis berwarna kuning.</p>
              </div>

              <div className="space-y-4">
                {features.items.map((feature, index) => (
                  <div key={feature.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setFeatures({ ...features, items: features.items.filter(f => f.id !== feature.id) })}>
                      <Trash2 className="size-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Judul</Label>
                        <Input value={feature.title} onChange={e => {
                          const newItems = [...features.items]
                          newItems[index].title = e.target.value
                          setFeatures({ ...features, items: newItems })
                        }} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Deskripsi</Label>
                        <Input value={feature.description} onChange={e => {
                          const newItems = [...features.items]
                          newItems[index].description = e.target.value
                          setFeatures({ ...features, items: newItems })
                        }} />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label>Icon Embed (SVG/Link)</Label>
                        <Input value={feature.iconEmbed} onChange={e => {
                          const newItems = [...features.items]
                          newItems[index].iconEmbed = e.target.value
                          setFeatures({ ...features, items: newItems })
                        }} placeholder="<svg>...</svg> or link" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {features.items.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                  Belum ada fitur. Klik "Tambah Fitur" untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTIMONIALS SECTION */}
        <TabsContent value="testimonials" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-primary" />
                  Testimoni Pelanggan
                </CardTitle>
                <CardDescription>Apa kata pelanggan tentang layanan Anda.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setTestimonials([...testimonials, { id: crypto.randomUUID(), name: '', role: '', content: '', stars: 5, initial: '' }])}>
                <Plus className="size-4 mr-2" /> Tambah Testimoni
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {testimonials.map((testi, index) => (
                <div key={testi.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setTestimonials(testimonials.filter(t => t.id !== testi.id))}>
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input value={testi.name} onChange={e => {
                        const newTesti = [...testimonials]
                        newTesti[index].name = e.target.value
                        setTestimonials(newTesti)
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role/Pekerjaan</Label>
                      <Input value={testi.role} onChange={e => {
                        const newTesti = [...testimonials]
                        newTesti[index].role = e.target.value
                        setTestimonials(newTesti)
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Inisial</Label>
                      <Input value={testi.initial} maxLength={2} onChange={e => {
                        const newTesti = [...testimonials]
                        newTesti[index].initial = e.target.value
                        setTestimonials(newTesti)
                      }} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Konten Testimoni</Label>
                      <Textarea value={testi.content} onChange={e => {
                        const newTesti = [...testimonials]
                        newTesti[index].content = e.target.value
                        setTestimonials(newTesti)
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ SECTION */}
        <TabsContent value="faq" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="size-5 text-primary" />
                  FAQ Section
                </CardTitle>
                <CardDescription>Pertanyaan yang sering diajukan.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setFaqs([...faqs, { id: crypto.randomUUID(), question: '', answer: '' }])}>
                <Plus className="size-4 mr-2" /> Tambah FAQ
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => setFaqs(faqs.filter(f => f.id !== faq.id))}>
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Pertanyaan</Label>
                    <Input value={faq.question} onChange={e => {
                      const newFaqs = [...faqs]
                      newFaqs[index].question = e.target.value
                      setFaqs(newFaqs)
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Jawaban</Label>
                    <Textarea value={faq.answer} onChange={e => {
                      const newFaqs = [...faqs]
                      newFaqs[index].answer = e.target.value
                      setFaqs(newFaqs)
                    }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NAVBAR & FOOTER SECTION */}
        <TabsContent value="navfoot" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="size-5 text-primary" />
                  Navbar Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo Teks</Label>
                    <Input value={navbar.logoText} onChange={e => setNavbar({...navbar, logoText: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo Icon Embed (Link/Image)</Label>
                    <Input value={navbar.logoIconEmbed} onChange={e => setNavbar({...navbar, logoIconEmbed: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-8 border-t pt-6">
                  <div className="flex items-center space-x-2">
                    <Switch checked={navbar.showProducts} onCheckedChange={v => setNavbar({...navbar, showProducts: v})} />
                    <Label>Tampilkan Menu Produk</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={navbar.showRedeem} onCheckedChange={v => setNavbar({...navbar, showRedeem: v})} />
                    <Label>Tampilkan Menu Redeem</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="size-5 text-primary" />
                  Footer & Kontak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Deskripsi Footer</Label>
                    <Textarea value={footer.address} onChange={e => setFooter({...footer, address: e.target.value})} placeholder="Deskripsi singkat layanan Anda di bagian bawah website." />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Support</Label>
                    <Input value={footer.email} onChange={e => setFooter({...footer, email: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* THEME SECTION */}
        <TabsContent value="theme" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="size-5 text-primary" />
                Theme Configuration
              </CardTitle>
              <CardDescription>
                Kustomisasi warna dasar landing page Anda menggunakan format shadcn (CSS Variables). Paste kode dari shadcn.com di sini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Shadcn CSS Code</Label>
                <Textarea 
                  className="font-mono text-xs min-h-[400px]"
                  placeholder=":root {&#10;  --background: oklch(1 0 0);&#10;  ...&#10;}"
                  value={themeCss}
                  onChange={e => setThemeCss(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
