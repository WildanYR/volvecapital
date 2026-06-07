import type { Account } from '@/dashboard/services/account.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { SelectInput } from '@/dashboard/components/forms/common/inputs/select-input'
import { Button } from '@/dashboard/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/dashboard/components/ui/dialog'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'

export function PagesAccountIndexDialogCommand({
  open,
  selectedAccount,
  onOpenChange,
}: {
  open?: boolean
  selectedAccount?: Account
  onOpenChange: (value: boolean) => void
}) {
  const auth = useAuth()
  const accountService = AccountServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )
  const queryClient = useQueryClient()
  const [selectedCommand, setSelectedCommand] = useState<string>('')

  const dispatchTaskMutation = useMutation({
    mutationFn: () => {
      if (!selectedAccount)
        throw new Error('No account selected')
      if (!selectedCommand)
        throw new Error('No command selected')

      // Generate 2 random letters
      const char1 = String.fromCharCode(Math.floor(Math.random() * 26) + 97)
      const char2 = String.fromCharCode(Math.floor(Math.random() * 26) + 97)
      const randomChars = `${char1}${char2}`
      // Timestamp in seconds (not milliseconds)
      const timestamp = Math.floor(Date.now() / 1000)
      const taskId = `${randomChars}${timestamp}`

      if (selectedCommand === 'netflix_reset_password') {
        const payload = JSON.stringify({
          id: selectedAccount.id,
          accountId: selectedAccount.id,
          email: selectedAccount.email.email,
          password: selectedAccount.account_password,
        })

        return accountService.dispatchTask(taskId, {
          module: 'netflix',
          type: 'resetPassword',
          executeAt: new Date().toISOString(),
          maxRetries: 0,
          payload,
        })
      }

      throw new Error('Unsupported command')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      toast.success('Command berhasil dikirim.')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Gagal mengeksekusi command: ${error.message}`)
    },
  })

  const commandItems = [
    { title: 'Netflix Reset Password', value: 'netflix_reset_password' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCommand) {
      toast.error('Silakan pilih command terlebih dahulu.')
      return
    }
    dispatchTaskMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-md">
        <DialogHeader>
          <DialogTitle>Jalankan Command</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <SelectInput
            name="command"
            label="Command"
            placeholder="Pilih command..."
            selectItems={commandItems}
            value={selectedCommand}
            onSelected={val => setSelectedCommand(val)}
          />
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={dispatchTaskMutation.isPending || !selectedCommand}
          >
            {dispatchTaskMutation.isPending ? 'Mengirim...' : 'Kirim'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
