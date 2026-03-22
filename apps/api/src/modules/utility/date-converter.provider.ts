import { Injectable } from '@nestjs/common';
import { FormatDateOptions } from './types/format-date-options.type';

@Injectable()
export class DateConverterProvider {
  getStartOfTheDayDate(date: Date): Date {
    const startDayDate = new Date(date);
    startDayDate.setHours(0, 0, 0, 0);
    return startDayDate;
  }

  getStartOfTheMonthDate(date = new Date()): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    return new Date(year, month, 1, 0, 0, 0, 0);
  }

  getEndOfTheDayDate(date: Date): Date {
    const endDayDate = new Date(date);
    endDayDate.setHours(23, 59, 59, 999);
    return endDayDate;
  }

  getEndOfTheMonthDate(date = new Date()): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    return new Date(year, month + 1, 0, 23, 59, 59, 999);
  }

  formatDateIdStandard(date?: Date, options?: FormatDateOptions) {
    if (!date)
      return '';

    const tanggal = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

    const waktu = date
      .toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: options?.showSecond ? '2-digit' : undefined,
        hour12: false,
        timeZone: 'Asia/Jakarta',
      })
      .replace('.', ':');
    let formatted = tanggal;
    if (!options?.hideTime) {
      formatted += ` ${waktu} WIB`;
    }
    return formatted;
  }
}
