export interface QueuedRecieveEmailPayload {
  tenant: string;
  emails: Array<{
    from: string;
    subject: string;
    date: string;
    text: string;
  }>;
}
