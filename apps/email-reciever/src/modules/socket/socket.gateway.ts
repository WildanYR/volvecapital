import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';

interface SendEventRequest {
  eventName: string;
  payload: any;
}

@Injectable()
export class SocketGateway {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async sendEvent(eventName: string, payload: any) {
    await this.request('events/send', {
      body: {
        eventName,
        payload,
      } satisfies SendEventRequest,
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
