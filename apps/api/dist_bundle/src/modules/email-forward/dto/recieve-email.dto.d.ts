declare class EmailDataDto {
    from: string;
    subject: string;
    date: Date;
    text: string;
}
export declare class RecieveEmailDto {
    emails: EmailDataDto[];
}
export {};
