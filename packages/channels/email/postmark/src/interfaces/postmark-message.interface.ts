export interface PostmarkMessage {
    From?: string;
    To?: string;
    Cc?: string;
    Bcc?: string;
    Subject?: string;
    Tag?: string;
    HtmlBody?: string;
    TextBody?: string;
    ReplyTo?: string;
    Headers?: { Name: string; Value: string }[];
    TrackOpens?: boolean;
    TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
    Metadata?: Record<string, string>;
    Attachments?: {
        Name: string;
        Content: string;
        ContentType: string;
        ContentID?: string;
    }[];
    [key: string]: any;
}
