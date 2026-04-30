import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Label } from '@/dashboard/components/ui/label'
import { Input } from '@/dashboard/components/ui/input'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import logo from '../logo.svg'

const LoginFormSchema = z.object({
  email: z.string().email('Email tidak valid').nonempty('Email harus diisi'),
  password: z.string().nonempty('Password harus diisi'),
})

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth?.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const navigate = Route.useNavigate()

  const form = useAppForm({
    validators: {
      onSubmit: LoginFormSchema,
    },
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await auth.login(value.email, value.password)
        formApi.reset()
        navigate({ to: '/dashboard' })
      }
      catch (error) {
        toast.error((error as Error).message)
      }
    },
  })
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-center items-center mb-6">
                <img src={logo} className="h-12" />
              </div>
              <CardTitle>Login ke Dashboard</CardTitle>
              <CardDescription>
                Masukkan email dan password Anda untuk masuk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form.AppForm>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                  }}
                >
                  <div className="flex flex-col gap-6">
                    <form.AppField
                      name="email"
                      children={field => (
                        <field.TextField
                          label="Email"
                          placeholder="admin@example.com"
                        />
                      )}
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-zinc-400 hover:text-emerald-500 transition-colors"
                        >
                          Lupa password?
                        </Link>
                      </div>
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
                    <form.SubscribeButton label="Login" />
                  </div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Belum punya akun?{' '}
                    <Link
                      to="/register"
                      className="text-emerald-500 hover:underline"
                    >
                      Daftar Sekarang
                    </Link>
                  </div>
                </form>
              </form.AppForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
