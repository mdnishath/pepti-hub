export interface Product {
  id: string;
  name: string;
  chemicalName: string;
  casNumber: string;
  purity: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * WooCommerce REST API v3 compatible coupon schema.
 * Maps to: GET /wp-json/wc/v3/coupons/<id>
 */
export interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "fixed_cart" | "fixed_product";
  amount: string; // WooCommerce stores as string
  description: string;
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
  minimum_amount: string;
  maximum_amount: string;
  product_ids: number[];
  excluded_product_ids: number[];
  free_shipping: boolean;
}

export interface AppliedCoupon {
  code: string;
  discount_type: Coupon["discount_type"];
  amount: string;
  discount_total: number; // calculated discount in dollars
}
