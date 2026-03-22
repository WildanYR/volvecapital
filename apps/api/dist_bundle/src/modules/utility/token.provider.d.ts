export declare class TokenProvider {
    signJwt<T>(secret: string, payload: T): Promise<string>;
    verifyJwt<T>(secret: string, token: string): Promise<T>;
    decodeJwt<T>(token: string): T;
}
