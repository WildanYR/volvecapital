import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import logo from '../logo.svg'

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

  // Owner login state
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [ownerLoading, setOwnerLoading] = useState(false)

  // Staff login state
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffTenantId, setStaffTenantId] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setOwnerLoading(true)
    try {
      await auth.login(ownerEmail, ownerPassword)
      navigate({ to: '/dashboard' })
    }
    catch (error) {
      toast.error((error as Error).message)
    }
    finally {
      setOwnerLoading(false)
    }
  }

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffTenantId.trim()) {
      toast.error('Tenant ID wajib diisi')
      return
    }
    setStaffLoading(true)
    try {
      await auth.loginAsStaff(staffEmail, staffPassword, staffTenantId)
      navigate({ to: '/dashboard' })
    }
    catch (error) {
      toast.error((error as Error).message)
    }
    finally {
      setStaffLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center items-center">
            <img src={logo} className="h-12 w-auto object-contain" />
          </div>
          <Tabs defaultValue="owner">
            <TabsList className="w-full">
              <TabsTrigger value="owner" className="flex-1">Owner</TabsTrigger>
              <TabsTrigger value="staff" className="flex-1">Staff</TabsTrigger>
            </TabsList>

            <TabsContent value="owner">
              <Card>
                <CardHeader>
                  <CardTitle>Login sebagai Owner</CardTitle>
                  <CardDescription>
                    Masukkan email dan password akun owner Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOwnerLogin} className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={ownerEmail}
                        onChange={e => setOwnerEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          Lupa password?
                        </Link>
                      </div>
                      <Input
                        type="password"
                        value={ownerPassword}
                        onChange={e => setOwnerPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={ownerLoading}>
                      {ownerLoading ? 'Masuk...' : 'Login'}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Belum punya akun?
                      {' '}
                      <Link to="/register" className="text-primary hover:underline">
                        Daftar Sekarang
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Login sebagai Staff</CardTitle>
                  <CardDescription>
                    Masukkan Tenant ID, email, dan password akun staff Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleStaffLogin} className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <Label>Tenant ID</Label>
                      <Input
                        value={staffTenantId}
                        onChange={e => setStaffTenantId(e.target.value)}
                        placeholder="cth: paytronik"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={staffEmail}
                        onChange={e => setStaffEmail(e.target.value)}
                        placeholder="staff@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={staffPassword}
                        onChange={e => setStaffPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={staffLoading}>
                      {staffLoading ? 'Masuk...' : 'Login sebagai Staff'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
