export interface BotCommandAcceptData {
    commandId: string;
    type: string;
}
export interface BotCommandDoneData {
    commandId: string;
    type: string;
    status: 'COMPLETED' | 'FAILED';
    message?: string;
}
