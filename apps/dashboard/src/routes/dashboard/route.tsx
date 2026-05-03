import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import {
  Blocks,
  FileText,
  House,
  Inbox,
  LogOut,
  Mail,
  Package,
  Receipt,
  Ticket,
  User,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/dashboard/components/ui/sidebar'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import logo from '@/dashboard/logo.svg'
import { StockNotification } from '@/dashboard/components/stock-notification'

const navGroups = [
  {
    title: 'Produk',
    items: [
      { title: 'Produk', url: '/dashboard/product', icon: Package },
      {
        title: 'Produk di Platform',
        url: '/dashboard/platform-product',
        icon: Blocks,
      },
    ],
  },
  {
    title: 'Akun',
    items: [
      { title: 'Email', url: '/dashboard/email', icon: Mail },
      { title: 'Akun', url: '/dashboard/account', icon: User },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      { title: 'Transaksi', url: '/dashboard/transaction', icon: Receipt },
      {
        title: 'Voucher Generator',
        url: '/dashboard/voucher-generator',
        icon: Ticket,
      },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Email Message', url: '/dashboard/email-message', icon: Inbox },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Landing Page', url: '/dashboard/setting', icon: House },
      { title: 'Tutorial', url: '/dashboard/setting/tutorial', icon: BookOpen },
      { title: 'Artikel', url: '/dashboard/setting/article', icon: FileText },
    ],
  },
]

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth?.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const navigate = Route.useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    auth.logout()
    navigate({ to: '/login' })
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <img src={logo} alt="volve capital logo" className="h-8" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard'}
                  >
                    <Link to="/dashboard">
                      <House />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {navGroups.map((nav, i) => (
            <SidebarGroup key={`nav=${i}`}>
              <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.items.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="p-3">
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="w-full cursor-pointer"
            >
              <span>
                <LogOut />
              </span>
              {' '}
              Logout
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 min-w-0 overflow-x-hidden max-w-full">
        <div className="flex justify-between items-center p-3 border-b-2 border-border bg-background sticky top-0 z-30">
          <SidebarTrigger className="cursor-pointer" />
          <div className="flex items-center gap-4">
            <StockNotification />
            <p className="font-semibold text-sm truncate max-w-[100px] sm:max-w-none">{auth.tenant!.id}</p>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
