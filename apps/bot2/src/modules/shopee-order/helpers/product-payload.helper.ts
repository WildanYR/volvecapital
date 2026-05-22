import { TransactionAccountItemPayload } from "../types/api.type.js";
import { ProductList } from "../types/product.type.js";

export function generateItemPayload(productList: ProductList[], totalPrice: number): TransactionAccountItemPayload[] {
 // 1. Safeguard jika array kosong
  if (productList.length === 0) {
    return [];
  }

  // 2. Fast Path / Early Exit: Jika hanya ada 1 item, berikan semua harga kepadanya
  if (productList.length === 1) {
    return [{
      product_variant_id: productList[0].id,
      price: totalPrice
    }];
  }

  // 3. Hitung total harga awal (gross) dari semua item
  const totalGross = productList.reduce((sum, item) => sum + item.price, 0);

  // Safeguard khusus jika totalGross = 0 (misalnya transaksi barang gratis / harga awal 0 semua)
  // Berikan seluruh totalPrice ke item pertama saja untuk menghindari pembagian dengan nol (NaN)
  if (totalGross === 0) {
    return productList.map((item, index) => ({
      product_variant_id: item.id,
      price: index === 0 ? totalPrice : 0
    }));
  }

  // 4. Hitung harga proporsional (floor) dan simpan remainder-nya
  let totalFloorPrice = 0;
  const mappedItems = productList.map(item => {
    const exactPrice = (item.price / totalGross) * totalPrice;
    const floorPrice = Math.floor(exactPrice);
    
    totalFloorPrice += floorPrice;

    return {
      id: item.id,
      floorPrice,
      remainder: exactPrice - floorPrice
    };
  });

  // 5. Cari selisih (shortfall) antara totalPrice target dengan total floor
  const shortfall = totalPrice - totalFloorPrice;

  // 6. Urutkan item berdasarkan sisa pecahan (remainder) terbesar
  // Kita clone array agar tidak merusak urutan asli saat output nanti
  const sortedItems = [...mappedItems].sort((a, b) => b.remainder - a.remainder);

  // 7. Distribusikan selisih (shortfall) dengan menambahkan 1 Rupiah ke item teratas
  for (let i = 0; i < shortfall; i++) {
    sortedItems[i].floorPrice += 1;
  }

  // 8. Kembalikan dalam format TransactionAccountItemPayload
  // Kita melakukan mapping dari `mappedItems` agar urutan (index) tetap sama persis seperti input `productList`
  return mappedItems.map(item => ({
    product_variant_id: item.id,
    price: item.floorPrice
  }));
}