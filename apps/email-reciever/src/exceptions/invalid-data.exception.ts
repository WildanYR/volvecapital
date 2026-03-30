import type { ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class InvalidDataException extends BadRequestException {
  constructor(errors: string | ValidationError[]) {
    let message: string[];

    if (typeof errors === 'string') {
      message = [errors];
    }
    else {
      message = InvalidDataException.extractMessages(errors);
    }

    super({ message, invalidData: true });
  }

  private static extractMessages(errors: ValidationError[]) {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children?.length) {
        messages.push(...InvalidDataException.extractMessages(error.children));
      }
    }

    return messages;
  }
}
