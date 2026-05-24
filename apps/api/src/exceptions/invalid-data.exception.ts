import type { ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class InvalidDataException extends BadRequestException {
  constructor(errors: string | ValidationError[]) {
    let message: string[];
    if (typeof errors === 'string') {
      message = [errors];
    }
    else {
      message = InvalidDataException.extractConstraints(errors);
    }
    super({ message, invalidData: true });
  }

  private static extractConstraints(errors: ValidationError[]): string[] {
    const result: string[] = [];
    for (const err of errors) {
      if (err.constraints) {
        result.push(...Object.values(err.constraints));
      }
      if (err.children && err.children.length > 0) {
        result.push(...this.extractConstraints(err.children));
      }
    }
    return result;
  }
}
