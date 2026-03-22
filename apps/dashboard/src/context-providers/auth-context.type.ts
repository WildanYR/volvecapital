export interface ITenant {
  id: string
  accessToken: string
}

export interface IAuthContext {
  isAuthenticated: boolean
  tenant: ITenant | null
  login: (tenantId: string, secret: string) => Promise<void>
  logout: () => void
}
