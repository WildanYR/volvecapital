import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

export interface AccountSearchFilter {
  email: string
  user: string
  billing: string
}

export function PagesAccountIndexSearch({ defaultSort, onSearchChanges, onSortChanges}: { defaultSort: string, onSearchChanges: (values: AccountSearchFilter) => void, onSortChanges: (values: string) => void }) {
  const [filter, setFilter] = useState<AccountSearchFilter>({
    email: '',
    user: '',
    billing: '',
  })
  const [sort, setSort] = useState(defaultSort || 'default')

  const handleSearchEmail = useDebouncedCallback((value: string) => {
    setFilter(prev => ({ ...prev, email: value }))
  }, 700)

  const handleSearchUser = useDebouncedCallback((value: string) => {
    setFilter(prev => ({ ...prev, user: value }))
  }, 700)

  const handleSearchBilling = useDebouncedCallback((value: string) => {
    setFilter(prev => ({ ...prev, billing: value }))
  }, 700)

  const handleSortChanges = (value: string) => {
    setSort(value)
    onSortChanges(value)
  }

  useEffect(() => {
    onSearchChanges(filter)
  }, [filter])

  return (
    <div className="flex flex-col md:flex-row justify-end items-center gap-4">
      <Input
        type="text"
        defaultValue={filter.email}
        placeholder="Cari Email..."
        onChange={e => handleSearchEmail(e.target.value)}
      />
      <Input
        type="text"
        defaultValue={filter.user}
        placeholder="Cari Nama User..."
        onChange={e => handleSearchUser(e.target.value)}
      />
      <Input
        type="text"
        defaultValue={filter.billing}
        placeholder="Cari Billing"
        onChange={e => handleSearchBilling(e.target.value)}
      />
      <div className="flex items-center gap-2 w-full md:w-min">
        <p className="text-sm">Urutkan:</p>
        <Select defaultValue={sort} onValueChange={handleSortChanges}>
          <SelectTrigger className="w-full md:w-min">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="email.email:asc">Email A-Z</SelectItem>
            <SelectItem value="email.email:desc">Email Z-A</SelectItem>
            <SelectItem value="batch_end_date:asc">
              Reset Password Terdekat
            </SelectItem>
            <SelectItem value="batch_end_date:desc">
              Reset Password Terlama
            </SelectItem>
            <SelectItem value="subscription_expiry:asc">
              Subscription Expired Terdekat
            </SelectItem>
            <SelectItem value="subscription_expiry:desc">
              Subscription Expired Terlama
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
