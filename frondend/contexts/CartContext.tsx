"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { cartAPI, type CartItem, type Cart } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface CartContextType {
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // Get values from backend response (backend calculates these)
  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.subtotal || 0;

  // Fetch cart when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (!isAuthenticated) {
        setCart(null);
        return;
      }

      try {
        setLoading(true);
        const cartData = await cartAPI.get();
        setCart(cartData);
      } catch (error: any) {
        console.error("Failed to fetch cart:", error);
        // Don't show error toast on initial load
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated]); // Removed 'user' to prevent infinite loops

  const fetchCart = async () => {
    if (!isAuthenticated) {
      console.log("Cannot fetch cart: User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartAPI.get();
      setCart(cartData);
    } catch (error: any) {
      // Handle different error types silently for cart fetching
      if (error.response?.status === 401) {
        console.log("Cart: User not authenticated");
      } else if (error.code === 'ERR_NETWORK') {
        console.log("Cart: Network error - backend may be unavailable");
      } else {
        console.log("Cart: Failed to fetch:", error.message || "Unknown error");
      }
      // Set empty cart on error to prevent undefined issues
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      setLoading(true);
      await cartAPI.addItem({ productId, quantity });
      await fetchCart();
      toast.success("Item added to cart!");

      // Auto-open cart drawer after adding item
      setIsOpen(true);
    } catch (error: any) {
      console.error("Failed to add item to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add item to cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated) return;

    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      setLoading(true);
      await cartAPI.updateItem(itemId, { quantity });
      await fetchCart();
      toast.success("Cart updated!");
    } catch (error: any) {
      console.error("Failed to update cart:", error);
      toast.error(error.response?.data?.message || "Failed to update cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartAPI.removeItem(itemId);
      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartAPI.clear();
      setCart(null);
      toast.success("Cart cleared!");
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
      toast.error(error.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const openCart = () => {
    setIsOpen(true);
  };
  const closeCart = () => setIsOpen(false);

  const value: CartContextType = {
    cart,
    isOpen,
    loading,
    itemCount,
    subtotal,
    openCart,
    closeCart,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
