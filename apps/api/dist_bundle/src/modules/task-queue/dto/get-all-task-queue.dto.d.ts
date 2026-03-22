import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';
export declare class GetAllTaskQueueQueryUrlDto extends BaseGetAllUrlQueryDto {
    id?: string;
    type?: string;
    status?: string;
    tenant_id?: string;
}
