import type { ReactNode } from 'react'
import { Button } from './ui/button'

export function TabButton({ children, tabActive, tabName, tabDefault, onClick}: { children: ReactNode, tabDefault?: boolean, tabName: string, tabActive: string, onClick?: (tabName: string) => void }) {
  const isActive = tabName === tabActive

  const handleClick = () => {
    if (onClick) {
      onClick(tabName)
    }
  }

  return (
    <Button variant={isActive ? 'default' : tabDefault ? 'secondary' : 'outline'} size="sm" onClick={() => { handleClick() }}>
      {children}
    </Button>
  )
}
