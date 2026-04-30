import { createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import logo from '../logo.svg'

const RegisterFormSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').nonempty('Username harus diisi'),
  email: z.string().email('Email tidak valid').nonempty('Email harus diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter').nonempty('Password harus diisi'),
  confirm_password: z.string().nonempty('Konfirmasi password harus diisi'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Password tidak cocok",
  path: ["confirm_password"],
});

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    if (context.auth?.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  const form = useAppForm({
    validators: {
      onSubmit: RegisterFormSchema,
    },
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const response = await fetch(`${API_URL}/public/tenant/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(value),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Gagal mendaftar')
        }

        toast.success(result.message || 'Registrasi berhasil!')
        formApi.reset()
        navigate({ to: '/login' })
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
              <CardTitle>Daftar Akun Tenant</CardTitle>
              <CardDescription>
                Buat akun dashboard untuk mengelola bisnis Anda
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
                      name="username"
                      children={field => (
                        <field.TextField
                          label="Username (Nama Tenant)"
                          placeholder="tokomaju"
                        />
                      )}
                    />
                    <form.AppField
                      name="email"
                      children={field => (
                        <field.TextField
                          label="Email"
                          placeholder="admin@example.com"
                        />
                      )}
                    />
                    <form.AppField
                      name="password"
                      children={field => (
                        <field.TextField
                          label="Password"
                          type="password"
                          placeholder="***********"
                        />
                      )}
                    />
                    <form.AppField
                      name="confirm_password"
                      children={field => (
                        <field.TextField
                          label="Konfirmasi Password"
                          type="password"
                          placeholder="***********"
                        />
                      )}
                    />
                    <form.SubscribeButton label="Daftar Sekarang" />
                  </div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Sudah punya akun?{' '}
                    <a href="/login" className="text-primary hover:underline font-medium">
                      Login Di Sini
                    </a>
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
