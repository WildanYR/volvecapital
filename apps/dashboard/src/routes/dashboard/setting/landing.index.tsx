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
  ArrowLeft
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
      if (settings.LANDING_TESTIMONIALS) setTestimonials(JSON.parse(settings.LANDING_TESTIMONIALS))
      if (settings.LANDING_FAQ) setFaqs(JSON.parse(settings.LANDING_FAQ))
      if (settings.LANDING_NAVBAR) setNavbar(JSON.parse(settings.LANDING_NAVBAR))
      if (settings.LANDING_FOOTER) setFooter(JSON.parse(settings.LANDING_FOOTER))
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
      LANDING_HERO: JSON.stringify(hero),
      LANDING_FEATURES: JSON.stringify(features),
      LANDING_TESTIMONIALS: JSON.stringify(testimonials),
      LANDING_FAQ: JSON.stringify(faqs),
      LANDING_NAVBAR: JSON.stringify(navbar),
      LANDING_FOOTER: JSON.stringify(footer),
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

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="hero" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10">Hero</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10">Fitur</TabsTrigger>
          <TabsTrigger value="testimonials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10">Testimoni</TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10">FAQ</TabsTrigger>
          <TabsTrigger value="navfoot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10">Nav & Footer</TabsTrigger>
        </TabsList>

        {/* HERO SECTION */}
        <TabsContent value="hero" className="mt-6">
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

                <div className="flex items-center justify-between border-t pt-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURES SECTION */}
        <TabsContent value="features" className="mt-6">
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
        <TabsContent value="testimonials" className="mt-6">
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
        <TabsContent value="faq" className="mt-6">
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
        <TabsContent value="navfoot" className="mt-6">
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
      </Tabs>
    </div>
  )
}
