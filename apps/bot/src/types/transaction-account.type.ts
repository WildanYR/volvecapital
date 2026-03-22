interface TransactionItem {
  product_variant_id: string;
}

export interface TransactionAccountPayload {
  customer: string;
  platform: string;
  total_price: number;
  items: TransactionItem[];
}
