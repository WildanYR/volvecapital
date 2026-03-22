import type React from 'react'
import { Link, useMatch } from '@tanstack/react-router'
import { SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'

export function SidebarItemButton({
  to,
  title,
  icon,
}: {
  to: string
  title: string
  icon: React.ReactNode
}) {
  const match = useMatch({ from: to as any, strict: false, shouldThrow: false })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match}>
        <Link to={to}>
          {icon}
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
