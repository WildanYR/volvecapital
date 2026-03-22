import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { BotCommandAcceptData, BotCommandDoneData } from './types/bot-command.type';
import { BotConnection, BotStatus } from './types/bot-connection.type';
export declare class BotConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly postgresProvider;
    private readonly taskQueueRepository;
    private bots;
    constructor(postgresProvider: PostgresProvider, taskQueueRepository: typeof TaskQueue);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleChangeBotStatus(client: Socket, data: {
        status: BotStatus;
    }): void;
    handleCommandAccepted(client: Socket, data: BotCommandAcceptData): Promise<void>;
    handleCommandDone(client: Socket, data: BotCommandDoneData): Promise<void>;
    sendTaskCommand(commandId: string, tenantId: string, type: string, payload: any): Promise<void>;
    sendShutdownCommand(socketId: string): void;
    getAvailableBot(tenantId: string, type: string): BotConnection | undefined;
    getBotList(tenantId: string): {
        id: string;
        bot_id: string;
        name: string;
        type: string;
        status: BotStatus;
    }[];
}
