import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';

interface DispatchTaskRequest {
  taskId: string;
  tenantId: string;
  dispatchTaskData?: {
    module?: string;
    type?: string;
    executeAt?: string;
    payload?: any;
  };
}

interface DispatchTaskResponse {
  clientId: string | null;
}

interface SendEventRequest {
  eventName: string;
  payload: any;
}

interface SubscriptionRequest {
  clientId: string;
  eventName: string;
}

interface SocketConnectionSummary {
  id: string;
  name: string;
  tenant_id: string;
  type: 'BOT' | 'WEB';
  inflight: number;
  connectedAt: number;
}

@Injectable()
export class SocketGateway {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async dispatchTask(
    taskId: string,
    tenantId: string,
    dispatchTaskData?: DispatchTaskRequest['dispatchTaskData'],
  ) {
    const response = await this.request<DispatchTaskResponse>('tasks/dispatch', {
      body: {
        taskId,
        tenantId,
        dispatchTaskData,
      } satisfies DispatchTaskRequest,
    });

    return response.clientId ?? undefined;
  }

  async sendEvent(eventName: string, payload: any) {
    await this.request('events/send', {
      body: {
        eventName,
        payload,
      } satisfies SendEventRequest,
    });
  }

  async subscribeClientToEvent(clientId: string, eventName: string) {
    await this.request('subscriptions/subscribe', {
      body: {
        clientId,
        eventName,
      } satisfies SubscriptionRequest,
    });
  }

  async unsubscribeClientToEvent(clientId: string, eventName: string) {
    await this.request('subscriptions/unsubscribe', {
      body: {
        clientId,
        eventName,
      } satisfies SubscriptionRequest,
    });
  }

  async getConnection(clientId: string): Promise<SocketConnectionSummary | null> {
    return await this.request<SocketConnectionSummary | null>(`connections/${clientId}`, {
      method: 'GET',
    });
  }

  private async request<T = void>(path: string, options: {
    method?: 'GET' | 'POST';
    body?: object;
  } = {}): Promise<T> {
    const baseUrl = this.configService.get<string>('socket.baseUrl');
    const internalSecret = this.configService.get<string>('socket.internalSecret');
    const method = options.method ?? 'POST';

    if (!baseUrl || !internalSecret) {
      throw new InternalServerErrorException('Socket app configuration missing');
    }

    const response = await fetch(`${baseUrl}/internal/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: method === 'GET' ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      const message = await response.text();
      this.logger.error(
        `Socket app request failed (${response.status}): ${message}`,
        undefined,
        'SocketClient',
      );
      throw new InternalServerErrorException('Socket app request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  }
}
