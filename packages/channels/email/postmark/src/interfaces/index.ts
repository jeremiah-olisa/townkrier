import { Message } from 'postmark';

export type PostmarkEmailData = Message;

export interface PostmarkApiResponse {
  To?: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}
