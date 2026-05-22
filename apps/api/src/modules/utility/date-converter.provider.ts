import { Injectable } from '@nestjs/common';
import { FormatDateOptions } from './types/format-date-options.type';

@Injectable()
export class DateConverterProvider {
  // Offset WIB = UTC+7 = 7 * 60 menit
  private readonly WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  private toWIBDate(date: Date): Date {
    return new Date(date.getTime() + this.WIB_OFFSET_MS);
  }

  private fromWIBToUTC(date: Date): Date {
    return new Date(date.getTime() - this.WIB_OFFSET_MS);
  }

  getStartOfTheDayDate(date: Date): Date {
    const wibDate = this.toWIBDate(date);
    wibDate.setUTCHours(0, 0, 0, 0); // jam 00:00 WIB
    return this.fromWIBToUTC(wibDate);
  }

  getStartOfTheMonthDate(date = new Date()): Date {
    const wibDate = this.toWIBDate(date);
    const year = wibDate.getUTCFullYear();
    const month = wibDate.getUTCMonth();
    const startWIB = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    return this.fromWIBToUTC(startWIB);
  }

  getEndOfTheDayDate(date: Date): Date {
    const wibDate = this.toWIBDate(date);
    wibDate.setUTCHours(23, 59, 59, 999); // jam 23:59:59 WIB
    return this.fromWIBToUTC(wibDate);
  }

  getEndOfTheMonthDate(date = new Date()): Date {
    const wibDate = this.toWIBDate(date);
    const year = wibDate.getUTCFullYear();
    const month = wibDate.getUTCMonth();
    const endWIB = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    return this.fromWIBToUTC(endWIB);
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
