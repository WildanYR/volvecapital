import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { KeyRound, Mail, ArrowLeft } from 'lucide-react'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordComponent,
})

function ForgotPasswordComponent() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/public/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        })

        const text = await response.text()
        const result = text ? JSON.parse(text) : {}
        
        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengirim email reset')
        }

        setIsSubmitted(true)
        toast.success('Email reset password telah dikirim!')
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setIsLoading(false)
      }
    },
  })

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Cek Email Anda</CardTitle>
            <CardDescription className="text-zinc-400 mt-2">
              Kami telah mengirimkan instruksi reset password ke email Anda. Silakan cek kotak masuk (atau spam) Anda.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full border-zinc-800 hover:bg-zinc-800 text-zinc-100">
              <Link to="/login">Kembali ke Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-xl shadow-emerald-500/10">
            <KeyRound className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Lupa Password?</h1>
          <p className="text-zinc-400 mt-2 text-center">
            Jangan khawatir, kami akan mengirimkan link untuk mereset password Anda.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email Terdaftar</Label>
                <form.Field
                  name="email"
                  children={(field) => (
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800/50 pt-4">
            <Link 
              to="/login" 
              className="text-sm text-zinc-400 hover:text-emerald-500 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
