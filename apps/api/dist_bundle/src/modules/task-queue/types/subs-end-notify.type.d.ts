export interface ISubsEndNotifyPayload {
    context: 'ORDER_SUCCESS' | 'ORDER_UNPROCCESS' | 'ORDER_FAIL' | 'APP_FAIL' | 'NEED_ACTION' | 'WARNING' | 'INFO';
    message: string;
    tenant_id: string;
}
