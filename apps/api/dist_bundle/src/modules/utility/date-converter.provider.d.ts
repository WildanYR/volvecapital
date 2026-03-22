import { FormatDateOptions } from './types/format-date-options.type';
export declare class DateConverterProvider {
    getStartOfTheDayDate(date: Date): Date;
    getStartOfTheMonthDate(date?: Date): Date;
    getEndOfTheDayDate(date: Date): Date;
    getEndOfTheMonthDate(date?: Date): Date;
    formatDateIdStandard(date?: Date, options?: FormatDateOptions): string;
}
