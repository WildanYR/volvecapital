import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { BookA, LibraryBig, Wallet, Scale, LineChart, PieChart, Lock, Settings, Activity } from 'lucide-react'

export const Route = createFileRoute('/dashboard/accounting')({
  component: AccountingLayout,
})

const accountingTabs = [
  { title: 'Bagan Akun (COA)', url: '/dashboard/accounting/coa', icon: BookA },
  { title: 'Jurnal Umum', url: '/dashboard/accounting/journal', icon: LibraryBig },
  { title: 'Buku Besar', url: '/dashboard/accounting/ledger', icon: Wallet },
  { title: 'Neraca Saldo', url: '/dashboard/accounting/trial-balance', icon: Scale },
  { title: 'Laba Rugi', url: '/dashboard/accounting/income-statement', icon: LineChart },
  { title: 'Neraca Keuangan', url: '/dashboard/accounting/balance-sheet', icon: PieChart },
  { title: 'Arus Kas', url: '/dashboard/accounting/cash-flow', icon: Activity },
  { title: 'Tutup Buku', url: '/dashboard/accounting/periods', icon: Lock },
  { title: 'Template Jurnal', url: '/dashboard/accounting/templates', icon: LibraryBig },
  { title: 'Pengaturan', url: '/dashboard/accounting/settings', icon: Settings },
]

function AccountingLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="border-b bg-card rounded-t-lg shadow-sm">
        <div className="flex overflow-x-auto p-1 scrollbar-hide">
          {accountingTabs.map(tab => {
            const isActive = pathname.startsWith(tab.url)
            return (
              <Link
                key={tab.url}
                to={tab.url}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.title}
              </Link>
            )
          })}
        </div>
      </div>
      
      <div className="flex-1 bg-card rounded-b-lg md:rounded-lg md:mt-2 shadow-sm relative overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
