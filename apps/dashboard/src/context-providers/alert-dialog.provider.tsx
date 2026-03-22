import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import React, { createContext, use, useCallback, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/dashboard/components/ui/alert-dialog'

interface AlertDialogOptions {
  title: string
  description?: string | ReactNode
  confirmText?: string
  cancelText?: string
  isConfirming?: boolean
  onConfirm: () => Promise<void> | void
}

interface AlertDialogContextType {
  showAlertDialog: (options: AlertDialogOptions) => void
  hideAlertDialog: () => void
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined,
)

// --- 2. Custom Hook `useGlobalAlertDialog` ---
export function useGlobalAlertDialog() {
  const context = use(AlertDialogContext)
  if (context === undefined) {
    throw new Error(
      'useGlobalAlertDialog must be used within a GlobalAlertDialogProvider',
    )
  }
  return context
}

// --- 3. Komponen `GlobalAlertDialogProvider` ---
interface GlobalAlertDialogProviderProps {
  children: ReactNode
}

export const GlobalAlertDialogProvider: React.FC<
  GlobalAlertDialogProviderProps
> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AlertDialogOptions | null>(null)

  const showAlertDialog = useCallback((opts: AlertDialogOptions) => {
    setOptions(opts)
    setIsOpen(true)
  }, [])

  const hideAlertDialog = useCallback(() => {
    setIsOpen(false)
    setOptions(null)
  }, [])

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      await options.onConfirm()
    }
  }

  const dialogValue = React.useMemo(
    () => ({ showAlertDialog, hideAlertDialog }),
    [showAlertDialog, hideAlertDialog],
  )

  return (
    <AlertDialogContext value={dialogValue}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {options?.title || 'Apakah Anda yakin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description
                ? options.description
                : 'Aksi ini tidak bisa dibatalkan'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={options?.isConfirming}>
              {options?.cancelText || 'Batal'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={options?.isConfirming}
            >
              {options?.isConfirming && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {options?.confirmText || 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext>
  )
}
