import type { ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
export declare class InvalidDataException extends BadRequestException {
    constructor(errors: string | ValidationError[]);
}
