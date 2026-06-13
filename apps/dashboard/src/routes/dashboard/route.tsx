import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import {
  Blocks,

  ChevronDown,
  FileText,
  House,
  Inbox,
  LogOut,
  Mail,
  Package,
  Receipt,
  Settings,

  Ticket,
  User,

} from 'lucide-react'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { StockNotification } from '@/dashboard/components/stock-notification'

import { can } from '@/dashboard/lib/permission'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
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

const navGroups = [
  {
    title: 'Produk',
    items: [
      { title: 'Produk', url: '/dashboard/product', icon: Package, permission: 'product.view' },
      {
        title: 'Produk di Platform',
        url: '/dashboard/platform-product',
        icon: Blocks,
        permission: 'platform_product.view',
      },
    ],
  },
  {
    title: 'Akun',
    items: [
      { title: 'Email', url: '/dashboard/email', icon: Mail, permission: 'email.view' },
      { title: 'Akun', url: '/dashboard/account', icon: User, permission: 'account.view' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Pengaturan Aplikasi', url: '/dashboard/setting', icon: Settings, permission: 'landing.view, content.view' },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      { title: 'Transaksi', url: '/dashboard/transaction', icon: Receipt, permission: 'transaction.view' },
      {
        title: 'Voucher Generator',
        url: '/dashboard/voucher-generator',
        icon: Ticket,
        permission: 'voucher.view',
      },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Email Message', url: '/dashboard/email-message', icon: Inbox, permission: 'email_message.view' },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { title: 'Wallet', url: '/dashboard/wallet', icon: Receipt, permission: 'wallet.view' },
    ],
  },
]

const adminGroups = [
  {
    title: 'Admin Panel',
    items: [
      { title: 'Approval WD', url: '/dashboard/admin/withdrawal', icon: FileText, permission: 'withdrawal.view' },
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
              <img src={logo} alt="digital premium logo" className="h-8 w-auto object-contain" />
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
          {navGroups.map((nav, i) => {
            // Filter items based on user permissions
            const visibleItems = nav.items.filter((item) => {
              if (!(item as any).permission) return true
              return can((item as any).permission, auth.tenant)
            })

            if (visibleItems.length === 0) return null

            return (
              <SidebarGroup key={`nav=${i}`}>
                <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const menuButton = (
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
                      )
                      if ((item as any).permission) {
                        return (
                          <PermissionGate key={item.title} permission={(item as any).permission}>
                            {menuButton}
                          </PermissionGate>
                        )
                      }
                      return menuButton
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
          {auth.tenant?.id === 'paytronik' && adminGroups.map((nav, i) => {
            // Filter admin items based on user permissions
            const visibleItems = nav.items.filter((item) => {
              if (!(item as any).permission) return true
              return can((item as any).permission, auth.tenant)
            })

            if (visibleItems.length === 0) return null

            return (
              <SidebarGroup key={`admin-nav=${i}`}>
                <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const menuButton = (
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
                      )
                      if ((item as any).permission) {
                        return (
                          <PermissionGate key={item.title} permission={(item as any).permission}>
                            {menuButton}
                          </PermissionGate>
                        )
                      }
                      return menuButton
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 min-w-0 overflow-x-hidden max-w-full">
        <div className="flex justify-between items-center p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <SidebarTrigger className="cursor-pointer" />
          <div className="flex items-center gap-4">
            <StockNotification />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md transition-colors outline-none cursor-pointer">
                <p className="font-semibold text-sm truncate max-w-[100px] sm:max-w-none">{auth.tenant?.id}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard/accountsetting">
                    <Settings className="mr-2 size-4" />
                    <span>Pengaturan Akun</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700">
                  <LogOut className="mr-2 size-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
