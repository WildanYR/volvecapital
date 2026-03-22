import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';
export declare class GetAllTransactionQueryUrlDto extends BaseGetAllUrlQueryDto {
    customer?: string;
    platform?: string;
    from_date?: Date;
    to_date?: Date;
}
