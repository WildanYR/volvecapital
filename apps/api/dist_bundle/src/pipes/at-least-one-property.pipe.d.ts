import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class AtLeastOnePropertyPipe implements PipeTransform {
    transform(value: any, _metadata: ArgumentMetadata): any;
}
