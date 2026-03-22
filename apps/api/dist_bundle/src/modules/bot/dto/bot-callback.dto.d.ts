export declare class BotAckDto {
    taskId: string;
    botId: string;
}
export declare class BotDoneDto {
    taskId: string;
    botId: string;
}
export declare class BotFailDto {
    taskId: string;
    botId: string;
    error?: string;
}
