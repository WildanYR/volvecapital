export interface LogWithNotifyOpts {
  notifyContext: 'INFO' | 'WARN' | 'ERROR' | 'NEED_ACTION';
  notifyMessage: string;
}
