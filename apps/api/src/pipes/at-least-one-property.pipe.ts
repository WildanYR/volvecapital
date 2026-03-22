import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class AtLeastOnePropertyPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    if (
      typeof value === 'object'
      && value !== null
      && Object.keys(value).length === 0
    ) {
      throw new BadRequestException(
        'Request body tidak boleh kosong. Setidaknya satu properti harus diisi untuk update.',
      );
    }

    return value;
  }
}
