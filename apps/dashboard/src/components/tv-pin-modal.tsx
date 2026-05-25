import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Monitor, Loader2, Send } from 'lucide-react'

interface TvPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSendPin: (pin: string) => void
  isSending: boolean
  email?: string
  errorMessage?: string | null
  isBotReady?: boolean
  progressMessage?: string | null
}

export function TvPinModal({ isOpen, onClose, onSendPin, isSending, email, errorMessage, isBotReady = true, progressMessage }: TvPinModalProps) {
  const [pin, setPin] = useState('')
  const [shouldShake, setShouldShake] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setShouldShake(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (errorMessage) {
      setShouldShake(true)
      const timer = setTimeout(() => setShouldShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length === 8) {
      onSendPin(pin)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md transition-transform duration-300 ${shouldShake ? 'animate-shake' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
        ` }} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Monitor className="size-5" />
            Input PIN Netflix TV
          </DialogTitle>
          <DialogDescription>
            Masukkan 8 digit kode yang muncul di layar TV untuk akun:
            <br />
            <span className="font-bold text-foreground">{email || 'Akun Netflix'}</span>
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium animate-in fade-in zoom-in">
            {errorMessage}
          </div>
        )}

        {!isBotReady ? (
           <div className="flex flex-col items-center justify-center py-10 gap-4">
             <Loader2 className="size-12 animate-spin text-red-600" />
             <div className="text-center space-y-1">
               <p className="font-bold text-lg">Bot Sedang Bekerja...</p>
               <p className="text-sm text-muted-foreground">{progressMessage || 'Mempersiapkan tugas, mohon tunggu...'}</p>
             </div>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pin" className="sr-only">8 Digit PIN</Label>
              <Input
                id="pin"
                placeholder="00000000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`text-center text-2xl tracking-[0.5em] font-mono h-14 ${errorMessage ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                autoFocus
                autoComplete="off"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Pastikan PIN sudah benar sebelum mengirim.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={pin.length !== 8 || isSending}
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-11"
              >
                {isSending ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
                Kirim PIN
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
