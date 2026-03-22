export declare class EmailParser {
    sanitizeEmail(email: string): string;
    extractNetflixResetLink(emailText: string): string | null;
    extractNetflixOtp(emailText: string): string | null;
}
