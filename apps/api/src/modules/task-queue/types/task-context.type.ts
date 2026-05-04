export interface AccountUnfreezePayload {
  accountId: string;
}

export interface AccountSubsEndNotifyPayload {
  context:
    | 'ORDER_SUCCESS'
    | 'ORDER_UNPROCCESS'
    | 'ORDER_FAIL'
    | 'APP_FAIL'
    | 'NEED_ACTION'
    | 'WARNING'
    | 'INFO';
  message: string;
  tenant_id: string;
}

export interface NetflixResetPasswordPayload {
  id: string;
  email: string;
  password: string;
  newPassword: string;
  accountId: string;
  subscription_expiry: string;
  variant_name: string;
}

export interface NetflixAutoReloadPayload {
  accountId: string;
  email: string;
  password: string;
  billing: string;
  variant_name: string;
}
