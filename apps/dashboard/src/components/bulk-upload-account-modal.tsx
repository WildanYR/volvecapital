import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, FileUp, Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Alert, AlertDescription } from '@/dashboard/components/ui/alert'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import type { BulkAccountItemPayload, BulkCreateAccountPayload } from '@/dashboard/services/account.service'

interface CSVRow {
  email: string
  password?: string
  'Subscription Berakhir'?: string
  status?: string
  Billing?: string
  'Harga Modal (HPP) '?: string
  'Varian Produk'?: string
  'label/ Catatan'?: string
  'Nama Profil'?: string
  'Maksimal User'?: string
  Metadata?: string
}

// Peta status: nilai yang diketik user → nilai yang dikenali sistem
const STATUS_MAP: Record<string, string> = {
  // nilai valid langsung diterima
  ready: 'ready',
  disable: 'disable',
  active: 'active',
  freeze: 'freeze',
  banned: 'banned',
  // alias umum yang mungkin diketik user
  enable: 'ready',
  enabled: 'ready',
  disabled: 'disable',
  frozen: 'freeze',
  ban: 'banned',
  nonaktif: 'disable',
  aktif: 'active',
}

const VALID_STATUSES = ['ready', 'disable', 'active', 'freeze', 'banned']

function normalizeStatus(raw: string | undefined): { value: string; corrected: boolean; original: string } {
  if (!raw) return { value: 'active', corrected: false, original: '' }
  const lower = raw.trim().toLowerCase()
  const mapped = STATUS_MAP[lower]
  if (mapped) {
    return { value: mapped, corrected: mapped !== lower, original: raw.trim() }
  }
  // tidak dikenali → default ke 'active'
  return { value: 'active', corrected: true, original: raw.trim() }
}

export function BulkUploadAccountModal() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: variantsData } = useQuery({
    queryKey: ['product-variants-for-bulk'],
    queryFn: () => productService.getAllProductVariant({}),
  })

  const bulkMutation = useMutation({
    mutationFn: (payload: BulkCreateAccountPayload) => accountService.bulkCreateAccount(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['product-pooling-stats'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })

      const skipped: string[] = (res as any).skipped_accounts ?? []
      const created: number = (res as any).created_accounts ?? 0

      if (created === 0 && skipped.length > 0) {
        // Semua akun sudah ada — tidak ada yang dibuat baru
        setErrorMsg(
          `Upload dibatalkan: Semua ${skipped.length} akun dari CSV sudah ada di database (${skipped.join(', ')}). Tidak ada akun baru yang dibuat.`
        )
        setIsProcessing(false)
        return
      }

      if (skipped.length > 0) {
        // Sebagian di-skip
        setWarnings(prev => [
          ...prev,
          `🚫 ${skipped.length} akun dilewati karena sudah ada di database: ${skipped.join(', ')}`
        ])
        toast.success(`${created} akun berhasil dibuat. ${skipped.length} akun dilewati (duplikat).`)
      } else {
        toast.success(res.message)
      }

      if (skipped.length === 0) {
        handleClose()
      } else {
        setIsProcessing(false)
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal memproses bulk upload.')
      setIsProcessing(false)
    },
  })

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setIsProcessing(false)
    setErrorMsg(null)
    setWarnings([])
  }

  const findVariantId = (name: string) => {
    if (!variantsData?.items || !name) return ''
    const searchName = name.toLowerCase().trim()
    const found = variantsData.items.find((v) => {
      const variantNameOnly = v.name.toLowerCase()
      const productPlusVariant = `${v.product?.name || ''} ${v.name}`.toLowerCase().trim()
      return variantNameOnly === searchName || productPlusVariant === searchName
    })
    return found?.id || ''
  }

  const handleUpload = () => {
    if (!file) return
    setIsProcessing(true)
    setErrorMsg(null)
    setWarnings([])

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data
          if (rows.length === 0) throw new Error('File CSV kosong.')

          const accountsMap = new Map<string, BulkAccountItemPayload>()
          const newWarnings: string[] = []
          const correctedStatusEmails = new Set<string>()

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (!row.email) continue

            const email = row.email.trim()
            const variantId = findVariantId(row['Varian Produk'] || '')

            if (!variantId && row['Varian Produk']) {
              if (!newWarnings.some(w => w.includes(row['Varian Produk']!))) {
                newWarnings.push(`⚠️ Varian "${row['Varian Produk']}" tidak ditemukan — akun ${email} tidak punya product_variant.`)
              }
            }

            if (!accountsMap.has(email)) {
              const statusResult = normalizeStatus(row.status)
              if (statusResult.corrected && !correctedStatusEmails.has(email)) {
                correctedStatusEmails.add(email)
                if (!VALID_STATUSES.includes(row.status?.toLowerCase().trim() || '')) {
                  newWarnings.push(
                    `ℹ️ Status "${statusResult.original}" pada baris ${i + 2} tidak valid → diubah ke "${statusResult.value}". `
                    + `Status yang valid: ready (Enable), disable, active, freeze, banned.`
                  )
                } else {
                  newWarnings.push(
                    `ℹ️ Status "${statusResult.original}" pada baris ${i + 2} dikoreksi ke "${statusResult.value}" (sistem menggunakan "ready" untuk Enable).`
                  )
                }
              }

              accountsMap.set(email, {
                email,
                account_password: row.password || '',
                subscription_expiry: new Date(row['Subscription Berakhir'] || new Date()),
                status: statusResult.value,
                billing: row.Billing,
                capital_price: Number(row['Harga Modal (HPP) ']) || 0,
                product_variant_id: variantId,
                label: row['label/ Catatan'],
                profile: [],
              })
            } else {
              // Email sudah ada — deteksi konflik data akun-level
              const existing = accountsMap.get(email)!
              const conflicts: string[] = []

              const rowDate = row['Subscription Berakhir']?.trim() || ''
              const existingDate = existing.subscription_expiry instanceof Date
                ? existing.subscription_expiry.toISOString().split('T')[0]
                : ''
              if (rowDate && rowDate !== existingDate) {
                conflicts.push(`Subscription Berakhir "${rowDate}" (baris ${i + 2}) ≠ "${existingDate}" (baris pertama)`)
              }

              const rowBilling = row.Billing?.trim() || ''
              const existingBilling = existing.billing?.trim() || ''
              if (rowBilling && rowBilling !== existingBilling) {
                conflicts.push(`Billing "${rowBilling}" ≠ "${existingBilling}"`)
              }

              const rowVariant = row['Varian Produk']?.trim() || ''
              const existingVariantId = existing.product_variant_id || ''
              const foundVariant = variantsData?.items?.find(v => v.id === existingVariantId)
              const existingVariantName = foundVariant
                ? `${foundVariant.product?.name || ''} ${foundVariant.name}`.trim()
                : existingVariantId
              if (rowVariant && variantId !== existingVariantId) {
                conflicts.push(`Varian Produk "${rowVariant}" ≠ "${existingVariantName}" — yang dipakai: "${existingVariantName}"`)
              }

              if (conflicts.length > 0) {
                newWarnings.push(
                  `⚠️ Email "${email}" punya data berbeda di baris ${i + 2} (hanya data baris pertama yang dipakai):\n   • ${conflicts.join('\n   • ')}`
                )
              }
            }

            const currentAcc = accountsMap.get(email)!

            // Tambahkan profil
            if (row['Nama Profil']) {
              let parsedMetadata: string | undefined = undefined
              if (row.Metadata) {
                const metaString = row.Metadata.trim()
                // Support format: "pin:1234,screen:2" → {"pin":"1234","screen":"2"}
                try {
                  const metaObj: Record<string, string> = {}
                  const pairs = metaString.split(',')
                  for (const pair of pairs) {
                    const colonIdx = pair.indexOf(':')
                    if (colonIdx > -1) {
                      const key = pair.slice(0, colonIdx).trim()
                      const value = pair.slice(colonIdx + 1).trim()
                      if (key) metaObj[key] = value
                    }
                  }
                  if (Object.keys(metaObj).length > 0) {
                    parsedMetadata = JSON.stringify(metaObj)
                  }
                } catch {
                  parsedMetadata = undefined
                }
              }

              currentAcc.profile!.push({
                name: row['Nama Profil'],
                max_user: Number(row['Maksimal User']) || 1,
                allow_generate: true,
                metadata: parsedMetadata,
              })
            }
          }

          const accounts = Array.from(accountsMap.values())
          if (accounts.length === 0) throw new Error('Tidak ada data akun valid yang bisa diproses.')

          setWarnings(newWarnings)
          bulkMutation.mutate({ accounts })
        } catch (err: any) {
          setErrorMsg(err.message)
          setIsProcessing(false)
        }
      },
      error: (err) => {
        setErrorMsg('Gagal membaca file CSV: ' + err.message)
        setIsProcessing(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="size-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Akun</DialogTitle>
          <DialogDescription>
            Upload file CSV yang berisi daftar akun dan profil. Pastikan header sesuai dengan format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Panduan status */}
          <Alert className="border-blue-500/40 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs space-y-1">
              <p className="font-semibold text-blue-400">Nilai Status yang valid di CSV:</p>
              <div className="grid grid-cols-2 gap-x-4 mt-1">
                <span><code className="text-blue-300">ready</code> → Enable (tersedia)</span>
                <span><code className="text-blue-300">disable</code> → Disable</span>
                <span><code className="text-blue-300">active</code> → Active (dipakai)</span>
                <span><code className="text-blue-300">freeze</code> → Freeze</span>
                <span><code className="text-blue-300">banned</code> → Banned</span>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setWarnings([]) }}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Sistem akan otomatis mengelompokkan profil jika email sama, dan membuat email baru jika belum terdaftar.
            </p>
          </div>

          {/* Peringatan koreksi */}
          {warnings.length > 0 && (
            <Alert className="border-yellow-500/40 bg-yellow-500/10">
              <CheckCircle2 className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-xs space-y-1">
                <p className="font-semibold text-yellow-400">Koreksi otomatis yang dilakukan:</p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-yellow-300">{w}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={handleUpload} disabled={!file || isProcessing} className="gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
