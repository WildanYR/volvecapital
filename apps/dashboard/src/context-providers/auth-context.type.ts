export interface ITenant {
  id: string
  accessToken: string
  permissions?: string[]
  role?: 'TENANT_OWNER' | 'DASHBOARD_USER'
  staffName?: string
}

export interface IAuthContext {
  isAuthenticated: boolean
  tenant: ITenant | null
  login: (tenantId: string, secret: string) => Promise<void>
  loginAsStaff: (email: string, password: string, tenantId: string) => Promise<void>
  logout: () => void
}
