export interface ConnectionTaskAcceptData {
    taskId: string;
}
export interface ConnectionTaskDoneData {
    taskId: string;
    status: 'COMPLETED' | 'FAILED';
    message?: string;
}
export interface ConnectionTaskRejectData {
    taskId: string;
    message: string;
}
export interface DispatchTaskData {
    module?: string;
    type?: string;
    executeAt?: string;
    payload?: any;
}
