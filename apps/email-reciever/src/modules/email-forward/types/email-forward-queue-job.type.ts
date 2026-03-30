import type { RecieveEmailDto } from '../dto/recieve-email.dto';

export interface EmailForwardQueueJob {
  id: number;
  payload: RecieveEmailDto;
  status: 'PENDING' | 'PROCESSING';
  attempt: number;
  available_at: string;
  created_at: string;
  started_at: string | null;
  last_error: string | null;
}
