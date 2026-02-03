export interface WaSendApiConfig {
    apiKey: string;
    device: string; // Device ID/Number
    gateway?: string; // e.g. 1, 2, 3
    baseUrl?: string;
    [key: string]: any;
}
