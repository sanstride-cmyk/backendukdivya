export interface ContactEmailData {
    name: string;
    email: string;
    phone?: string;
    message: string;
    source?: string;
}
export interface LeadEmailData {
    name: string;
    email: string;
    phone?: string;
    service?: string;
    source: string;
}
export declare function sendContactNotification(data: ContactEmailData): Promise<boolean>;
export declare function sendLeadNotification(data: LeadEmailData): Promise<boolean>;
//# sourceMappingURL=email.d.ts.map