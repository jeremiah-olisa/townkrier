export interface WaSendApiMessage {
    to?: string;
    msg?: string;
    type?: 'text' | 'image' | 'video' | 'pdf' | 'xls';
    url?: string; // For media
    schedule?: string;
    [key: string]: any;
}
