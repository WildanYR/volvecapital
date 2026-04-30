import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    }
  },
})

function ResetPasswordComponent() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        toast.error('Password tidak cocok')
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/public/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password: value.password,
          }),
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.message || 'Gagal mereset password')
        }

        setIsSuccess(true)
        toast.success('Password berhasil diperbarui!')
        setTimeout(() => navigate({ to: '/login' }), 3000)
      } catch (error) {
        toast.error((error as Error).message)
      } finally {
        setIsLoading(false)
      }
    },
  })

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription className="text-zinc-400">
              Token reset password tidak ditemukan atau tidak valid. Silakan minta link reset baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700">
              <Link to="/forgot-password">Minta Link Reset Baru</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Diperbarui!</CardTitle>
            <CardDescription className="text-zinc-400 mt-2">
              Password Anda telah berhasil diubah. Mengalihkan Anda ke halaman login dalam beberapa detik...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             <Link to="/login" className="text-emerald-500 hover:underline flex items-center gap-2">
               Klik di sini jika tidak beralih otomatis <ArrowRight className="w-4 h-4" />
             </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Atur Password Baru</h1>
          <p className="text-zinc-400 mt-2 text-center">
            Silakan masukkan password baru Anda yang kuat.
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
                <Label htmlFor="password">Password Baru</Label>
                <form.Field
                  name="password"
                  children={(field) => (
                    <Input
                      id="password"
                      type="password"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-emerald-500"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <form.Field
                  name="confirmPassword"
                  children={(field) => (
                    <Input
                      id="confirmPassword"
                      type="password"
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
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                disabled={isLoading}
              >
                {isLoading ? 'Menyimpan...' : 'Perbarui Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
