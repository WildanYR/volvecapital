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
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import logo from '../logo.svg'

const LoginFormSchema = z.object({
  tenant_id: z.string().nonempty(),
  secret: z.string().nonempty(),
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
      tenant_id: '',
      secret: '',
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await auth.login(value.tenant_id, value.secret)
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
                Gunakan App ID dan secret yang diberikan untuk login
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
                      name="tenant_id"
                      children={field => (
                        <field.TextField
                          label="App ID"
                          placeholder="Masukkan App ID..."
                        />
                      )}
                    />
                    <form.AppField
                      name="secret"
                      children={field => (
                        <field.TextField
                          label="Secret"
                          type="password"
                          placeholder="***********"
                        />
                      )}
                    />
                    <form.SubscribeButton label="Login" />
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
