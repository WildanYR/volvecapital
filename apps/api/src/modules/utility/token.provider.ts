import { Injectable } from '@nestjs/common';
import {
  decode as jwtDecode,
  sign as jwtSign,
  verify as jwtVerify,
} from 'jsonwebtoken';

@Injectable()
export class TokenProvider {
  async signJwt<T>(secret: string, payload: T): Promise<string> {
    return new Promise((resolve, reject) => {
      jwtSign(
        payload as object,
        secret,
        { algorithm: 'HS256' },
        (error, token) => {
          if (error)
            reject(error);
          else resolve(token!);
        },
      );
    });
  }

  async verifyJwt<T>(secret: string, token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      jwtVerify(token, secret, { algorithms: ['HS256'] }, (error, payload) => {
        if (error)
          reject(error);
        else resolve(payload as T);
      });
    });
  }

  decodeJwt<T>(token: string): T {
    return jwtDecode(token) as T;
  }
}
