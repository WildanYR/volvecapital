import { useQuery } from '@tanstack/react-query'
import { Warehouse } from 'lucide-react'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Skeleton } from '../../ui/skeleton'

interface AccountCountFilter {
  product_id?: string
  product_variant_id?: string
}

export function PagesAccountIndexCount({ accountCountFilter}: { accountCountFilter?: AccountCountFilter }) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const { data: countAccounts, isLoading: isFetchCountAccountsLoading }
    = useQuery({
      queryKey: ['countAccount', accountCountFilter?.product_variant_id],
      queryFn: ({ signal }) =>
        accountService.countStatusAccount(
          accountCountFilter?.product_variant_id,
          signal,
        ),
    })

  if (isFetchCountAccountsLoading) {
    return <Skeleton className="h-20 rounded-md" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stok Akun</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Akun Generate Tersedia
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.accounts_with_slots}
            </p>
          </div>
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Profil Generate Tersedia
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.profiles_available}
            </p>
          </div>
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Akun Penuh
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.accounts_full}
            </p>
          </div>
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Akun Disable/ Freeze
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.accounts_disabled_or_frozen}
            </p>
          </div>
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Profil Disallow Generate
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.profiles_locked_but_has_slot}
            </p>
          </div>
          <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
            <p className="text-muted-foreground inline-flex items-center gap-1">
              <Warehouse className="size-4" />
              {' '}
              Akun Berakhir Hari Ini
            </p>
            <p className="font-semibold text-2xl">
              {countAccounts?.accounts_expiring_today}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
