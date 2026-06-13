import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/dashboard/components/ui/button'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/dashboard/components/ui/dropdown-menu'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import type { Account } from '@/dashboard/services/account.service'
import { LabelServiceGenerator } from '@/dashboard/services/label.service'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { Link } from '@tanstack/react-router'

interface AccountLabelSelectorProps {
  account: Account
}

export function AccountLabelSelector({ account }: AccountLabelSelectorProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const auth = useAuth()
  
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const labelService = LabelServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: availableLabels } = useQuery({
    queryKey: ['labels', account.product_variant_id],
    queryFn: () => labelService.findAll(account.product_variant_id),
    enabled: open,
  })

  const assignMutation = useMutation({
    mutationFn: (labelId: string) => accountService.assignLabel(account.id, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Label berhasil ditambahkan ke akun')
    },
    onError: (error: any) => {
      toast.error(`Gagal menambahkan label: ${error.message}`)
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (labelId: string) => accountService.unassignLabel(account.id, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Label berhasil dilepas dari akun')
    },
    onError: (error: any) => {
      toast.error(`Gagal melepas label: ${error.message}`)
    },
  })

  const currentLabels = account.labels || []
  const currentLabelIds = currentLabels.map(l => l.id)

  const unassignedLabels = availableLabels?.filter(l => !currentLabelIds.includes(l.id)) || []

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      {currentLabels.map((label) => (
        <div 
          key={label.id} 
          className="group flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
          style={{ 
            backgroundColor: label.color ? `${label.color}20` : 'rgba(255,255,255,0.1)',
            borderColor: label.color || 'var(--border)',
            color: label.color || 'inherit'
          }}
        >
          <Link 
            to="/dashboard/account/$slug"
            params={{ slug: (account.product_variant.product as any)?.slug || '' }}
            search={(prev: any) => ({ ...prev, label_ids: label.id, page: 1 })}
            className="hover:underline transition-all"
            style={{ color: label.color || 'inherit' }}
          >
            {label.name}
          </Link>
          <button 
            onClick={() => unassignMutation.mutate(label.id)}
            disabled={unassignMutation.isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            style={{ color: label.color || 'inherit' }}
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 py-0 border border-dashed border-muted-foreground/50 text-muted-foreground hover:text-foreground text-xs font-normal">
            <Plus className="size-3 mr-1" /> Tambah Label
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Pilih Label</div>
          <DropdownMenuSeparator />
          {unassignedLabels.length === 0 ? (
            <div className="px-2 py-3 text-sm text-center text-muted-foreground italic">
              Tidak ada label tersedia
            </div>
          ) : (
            unassignedLabels.map(label => (
              <DropdownMenuItem 
                key={label.id}
                onSelect={(e) => {
                  e.preventDefault()
                  assignMutation.mutate(label.id)
                  setOpen(false)
                }}
                className="cursor-pointer flex items-center gap-2"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: label.color || 'var(--border)' }} 
                />
                {label.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
