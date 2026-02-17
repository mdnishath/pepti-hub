// Dummy data mirroring WooCommerce REST API v3 response shapes

export interface WooAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface WooLineItem {
  id: number;
  product_id: string;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image: { src: string };
}

export interface WooOrder {
  id: number;
  number: string;
  status: "processing" | "completed" | "on-hold" | "pending";
  date_created: string;
  total: string;
  subtotal: string;
  shipping_total: string;
  total_tax: string;
  payment_method_title: string;
  line_items: WooLineItem[];
  billing: WooAddress;
  shipping: WooAddress;
}

export interface WooCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  billing: WooAddress;
  shipping: WooAddress;
}

export const dummyCustomer: WooCustomer = {
  id: 1,
  first_name: "Alex",
  last_name: "Johnson",
  email: "alex.johnson@example.com",
  billing: {
    first_name: "Alex",
    last_name: "Johnson",
    company: "Research Labs Inc.",
    address_1: "456 Science Ave",
    address_2: "Suite 200",
    city: "Orlando",
    state: "FL",
    postcode: "32801",
    country: "US",
    email: "alex.johnson@example.com",
    phone: "(555) 987-6543",
  },
  shipping: {
    first_name: "Alex",
    last_name: "Johnson",
    company: "Research Labs Inc.",
    address_1: "456 Science Ave",
    address_2: "Suite 200",
    city: "Orlando",
    state: "FL",
    postcode: "32801",
    country: "US",
  },
};

export const dummyOrders: WooOrder[] = [
  {
    id: 1001,
    number: "1001",
    status: "completed",
    date_created: "2025-12-15T14:30:00",
    total: "113.00",
    subtotal: "113.00",
    shipping_total: "0.00",
    total_tax: "0.00",
    payment_method_title: "Credit Card",
    billing: dummyCustomer.billing,
    shipping: dummyCustomer.shipping,
    line_items: [
      {
        id: 1,
        product_id: "bpc-157",
        name: "BPC-157",
        quantity: 1,
        subtotal: "55.00",
        total: "55.00",
        price: 55,
        image: { src: "/images/peptihub-product.png" },
      },
      {
        id: 2,
        product_id: "tb-500",
        name: "TB-500",
        quantity: 1,
        subtotal: "58.00",
        total: "58.00",
        price: 58,
        image: { src: "/images/peptihub-product.png" },
      },
    ],
  },
  {
    id: 1002,
    number: "1002",
    status: "processing",
    date_created: "2026-01-22T09:15:00",
    total: "62.00",
    subtotal: "62.00",
    shipping_total: "0.00",
    total_tax: "0.00",
    payment_method_title: "Credit Card",
    billing: dummyCustomer.billing,
    shipping: dummyCustomer.shipping,
    line_items: [
      {
        id: 3,
        product_id: "ghk-cu",
        name: "GHK-Cu",
        quantity: 1,
        subtotal: "62.00",
        total: "62.00",
        price: 62,
        image: { src: "/images/peptihub-product.png" },
      },
    ],
  },
  {
    id: 1003,
    number: "1003",
    status: "on-hold",
    date_created: "2026-02-05T16:45:00",
    total: "117.00",
    subtotal: "117.00",
    shipping_total: "0.00",
    total_tax: "0.00",
    payment_method_title: "PayPal",
    billing: dummyCustomer.billing,
    shipping: dummyCustomer.shipping,
    line_items: [
      {
        id: 4,
        product_id: "ipamorelin",
        name: "Ipamorelin",
        quantity: 1,
        subtotal: "49.00",
        total: "49.00",
        price: 49,
        image: { src: "/images/peptihub-product.png" },
      },
      {
        id: 5,
        product_id: "ll-37",
        name: "LL-37",
        quantity: 1,
        subtotal: "68.00",
        total: "68.00",
        price: 68,
        image: { src: "/images/peptihub-product.png" },
      },
    ],
  },
];
