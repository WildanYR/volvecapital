import type { ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class InvalidDataException extends BadRequestException {
  constructor(errors: string | ValidationError[]) {
    let message: string[];
    if (typeof errors === 'string') {
      message = [errors];
    }
    else {
      message = [];
      for (const err of errors) {
        message.push(...Object.values(err.constraints!));
      }
    }
    super({ message, invalidData: true });
  }
}
