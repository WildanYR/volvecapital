import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { House, LayoutTemplate, Loader2, BookOpen, FileText } from 'lucide-react'


import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'


import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { SettingServiceGenerator } from '@/dashboard/services/setting.service'
import { PermissionGate } from '@/dashboard/components/permission-gate'


export const Route = createFileRoute('/dashboard/setting/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()

  const settingService = SettingServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const hasSettingView = auth.tenant?.role === 'TENANT_OWNER' || auth.tenant?.permissions?.includes('setting.view')

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingService.getSettings(),
    enabled: !!auth.tenant?.accessToken && hasSettingView,
  })

  // settings query is still needed if we want to display anything else, but for now it's just the CMS cards.


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-center gap-2">
        <House className="size-6 text-primary" />
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">Pengaturan Aplikasi</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PermissionGate permission="landing.view">
          <Card className="border-primary/50 bg-primary/5 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <LayoutTemplate className="size-5" />
                Landing Page CMS
              </CardTitle>
              <CardDescription>Kustomisasi hero, fitur, testimoni, FAQ, navbar, dan footer website Anda.</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/dashboard/setting/landing">Buka Pengaturan Landing Page</Link>
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>

        <PermissionGate permission="content.view">
          <Card className="border-primary/50 bg-primary/5 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen className="size-5" />
                Tutorial
              </CardTitle>
              <CardDescription>Kelola video tutorial dan panduan penggunaan untuk ditampilkan ke user.</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/dashboard/setting/tutorial">Kelola Tutorial</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="size-5" />
                Artikel / Blog
              </CardTitle>
              <CardDescription>Buat dan kelola artikel atau blog post untuk ditampilkan di landing page.</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/dashboard/setting/article">Kelola Artikel</Link>
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>

    </div>
  )
}
