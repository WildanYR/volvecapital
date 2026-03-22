import { Injectable } from '@nestjs/common';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_ORDER,
} from 'src/constants/pagination.const';
import {
  BASE_GET_ALL_URL_QUERY_KEYS,
  BaseGetAllUrlQuery,
} from './types/base-get-all-url-query.type';
import {
  IPaginationResponse,
  OrderItem,
  OrderType,
} from './types/pagination.type';

@Injectable()
export class PaginationProvider {
  generatePaginationQuery(baseUrlQuery?: BaseGetAllUrlQuery) {
    const page = baseUrlQuery?.page ?? 1;
    const limit = baseUrlQuery?.limit ?? PAGINATION_DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let order: OrderType | undefined;
    if (baseUrlQuery?.order_by) {
      const orderArr = [baseUrlQuery.order_by];
      if (baseUrlQuery.order_direction) {
        orderArr.push(baseUrlQuery.order_direction);
      }
      else {
        orderArr.push('DESC');
      }
      order = [orderArr as OrderItem];
    }
    else {
      order = PAGINATION_DEFAULT_ORDER as OrderType;
    }

    return { limit, offset, order };
  }

  generatePaginationResponse<ItemType>(
    items: ItemType[],
    totalItems: number,
    baseUrlQuery?: BaseGetAllUrlQuery,
  ): IPaginationResponse<ItemType> {
    const page = baseUrlQuery?.page ?? 1;
    const limit = baseUrlQuery?.limit ?? PAGINATION_DEFAULT_LIMIT;
    const totalPage = totalItems ? Math.ceil(totalItems / limit) : 1;

    return {
      items,
      paginationData: {
        currentPage: page,
        totalPage,
        totalItems,
        limit,
      },
      orderData: {
        orderBy: baseUrlQuery?.order_by ?? 'id',
        orderDirection: baseUrlQuery?.order_direction ?? 'DESC',
      },
    };
  }

  separateUrlParameter<FilterType>(urlQueryData: Record<string, any>) {
    const pagination: Partial<BaseGetAllUrlQuery> = {};
    const filter: FilterType | Record<string, any> = {};

    for (const key of Object.keys(urlQueryData)) {
      if (
        BASE_GET_ALL_URL_QUERY_KEYS.includes(key as keyof BaseGetAllUrlQuery)
      ) {
        if (urlQueryData[key] !== undefined) {
          pagination[key] = urlQueryData[key];
        }
      }
      else {
        if (urlQueryData[key] !== undefined) {
          filter[key] = urlQueryData[key];
        }
      }
    }

    return { pagination, filter };
  }
}
