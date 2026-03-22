import type { Email, GetEmailsParams } from '@/dashboard/services/email.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { EmailServiceGenerator } from '@/dashboard/services/email.service'

export function EmailSelect({
  selectedItem,
  onSelect,
}: {
  selectedItem?: Email
  onSelect: (selected?: Email) => void
}) {
  const auth = useAuth()
  const emailService = EmailServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [params, setParams] = useState<GetEmailsParams>({
    email: '',
    page: 1,
    order_by: '',
    order_direction: undefined,
  })

  const { data: emails, isLoading: isFetchEmailLoading } = useQuery({
    queryKey: ['email', params],
    queryFn: () => emailService.getAllEmail(params),
  })

  const handleRadioValueChange = (value: string) => {
    const selectedEmail = emails?.items.length
      ? emails.items.find(v => v.id === (value as any))
      : undefined
    if (!selectedEmail) {
      onSelect(undefined)
    }
    else {
      onSelect(selectedEmail)
    }
    setIsOpen(false)
  }

  const handlePaginationChange = (page: number) => {
    setParams({ ...params, page })
  }

  const handleSortChange = (value: string) => {
    if (value === 'default') {
      setParams({ ...params, order_by: '', order_direction: undefined })
    }
    else {
      const [orderBy, orderDirection] = value.split(':')
      setParams({
        ...params,
        order_by: orderBy,
        order_direction: orderDirection as OrderByDirection,
      })
    }
  }

  const handleSearchEmail = (email: string) => {
    setParams({ ...params, email })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={selectedItem ? 'outline' : 'outline-dashed'}
          className="w-full"
        >
          {selectedItem
            ? (
                <span className="flex-1 text-left font-normal">
                  {selectedItem.email}
                </span>
              )
            : (
                'Pilih Email...'
              )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen sm:max-w-none max-w-none rounded-none flex flex-col p-4 md:p-14">
        <DialogHeader>
          <DialogTitle>Pilih Email</DialogTitle>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Input
              type="text"
              defaultValue={params.email}
              placeholder="Cari Email..."
              onChange={e => handleSearchEmail(e.target.value)}
            />
            <div className="flex items-center gap-2 w-full md:w-min">
              <p className="text-sm">Urutkan:</p>
              <Select defaultValue="default" onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:w-min">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="email:asc">Email A-Z</SelectItem>
                  <SelectItem value="email:desc">Email Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>
        {isFetchEmailLoading
          ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </div>
            )
          : emails?.items.length
            ? (
                <RadioGroup
                  value={selectedItem?.id ?? ''}
                  onValueChange={handleRadioValueChange}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {emails.items.map(email => (
                    <RadioGroupItem
                      key={email.id}
                      id={email.id}
                      value={email.id}
                      className="bg-secondary p-4 rounded-md flex justify-between items-center gap-4 data-[state=checked]:bg-primary/30 data-[state=checked]:border data-[state=checked]:border-primary"
                    >
                      <p>{email.email}</p>
                    </RadioGroupItem>
                  ))}
                </RadioGroup>
              )
            : (
                <NoData>Email tidak ditemukan</NoData>
              )}
        {!!emails && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={emails.paginationData.currentPage}
              totalPages={emails.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
