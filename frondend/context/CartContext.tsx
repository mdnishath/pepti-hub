"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Product, CartItem, AppliedCoupon } from "@/types/product";

/**
 * Demo coupon store — will be replaced by WooCommerce API calls.
 * Maps to: GET /wp-json/wc/v3/coupons?code=<code>
 */
const DEMO_COUPONS: Record<string, { discount_type: "percent" | "fixed_cart"; amount: string; minimum_amount: string }> = {
  PEPTIHUB10: { discount_type: "percent", amount: "10", minimum_amount: "0" },
  SAVE20: { discount_type: "fixed_cart", amount: "20", minimum_amount: "100" },
  RESEARCH15: { discount_type: "percent", amount: "15", minimum_amount: "150" },
};

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  itemCount: number;
  subtotal: number;
  /** Applied coupon (one at a time, per WooCommerce default) */
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  /** Subtotal after coupon discount */
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // Calculate coupon discount
  const calculateDiscount = useCallback((coupon: AppliedCoupon | null, currentSubtotal: number): number => {
    if (!coupon) return 0;
    const amount = parseFloat(coupon.amount);
    if (coupon.discount_type === "percent") {
      return Math.round(currentSubtotal * (amount / 100) * 100) / 100;
    }
    // fixed_cart
    return Math.min(amount, currentSubtotal);
  }, []);

  const discountTotal = calculateDiscount(appliedCoupon, subtotal);
  const total = Math.max(subtotal - discountTotal, 0);

  // Update discount_total on the applied coupon whenever subtotal changes
  const currentCoupon = appliedCoupon
    ? { ...appliedCoupon, discount_total: discountTotal }
    : null;

  /**
   * Apply a coupon code.
   * In production, this will call: POST /wp-json/wc/v3/coupons?code=<code>
   * or validate via the WooCommerce cart/coupon endpoint.
   */
  const applyCoupon = useCallback((code: string): { success: boolean; message: string } => {
    const normalised = code.trim().toUpperCase();

    if (!normalised) {
      return { success: false, message: "Please enter a promo code." };
    }

    if (appliedCoupon?.code === normalised) {
      return { success: false, message: "This code is already applied." };
    }

    const couponData = DEMO_COUPONS[normalised];
    if (!couponData) {
      return { success: false, message: "Invalid promo code. Please try again." };
    }

    const minAmount = parseFloat(couponData.minimum_amount);
    if (subtotal < minAmount) {
      return { success: false, message: `Minimum order of $${minAmount.toFixed(2)} required for this code.` };
    }

    const discount = couponData.discount_type === "percent"
      ? Math.round(subtotal * (parseFloat(couponData.amount) / 100) * 100) / 100
      : Math.min(parseFloat(couponData.amount), subtotal);

    setAppliedCoupon({
      code: normalised,
      discount_type: couponData.discount_type,
      amount: couponData.amount,
      discount_total: discount,
    });

    return { success: true, message: `Code "${normalised}" applied! You save $${discount.toFixed(2)}.` };
  }, [appliedCoupon, subtotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity,
        itemCount, subtotal,
        appliedCoupon: currentCoupon, applyCoupon, removeCoupon,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
