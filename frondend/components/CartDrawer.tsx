"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { getFullImageUrl } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 200;

const CartDrawer = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    cart, isOpen, closeCart, updateQuantity, removeItem,
    subtotal, itemCount, loading
  } = useCart();

  const items = cart?.items || [];
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const awayFromFree = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    closeCart();
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-deep-blue">
            View Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </SheetTitle>
          <button onClick={closeCart} className="text-sm text-primary hover:underline mt-1 text-left">
            Continue Shopping →
          </button>
        </SheetHeader>

        {/* Shipping Progress */}
        <div className="px-6 py-4 bg-surface">
          {awayFromFree > 0 ? (
            <p className="text-sm text-muted-foreground mb-2">
              You are <span className="font-semibold text-primary">${awayFromFree.toFixed(2)}</span> away from <span className="font-semibold">FREE Shipping</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-primary mb-2">🎉 You qualify for FREE Shipping!</p>
          )}
          <Progress value={shippingProgress} className="h-2" />
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button variant="outline" onClick={() => { closeCart(); router.push("/shop"); }} className="mt-4">
                Continue Shopping
              </Button>
            </div>
          )}
          {items.map((item) => {
            const product = item.product;
            const imageUrl = product.images && product.images.length > 0
              ? getFullImageUrl(product.images[0])
              : "/placeholder.svg";

            return (
              <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-16 w-16 object-cover rounded-md bg-surface p-1"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-deep-blue truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">${Number(product.price || 0).toFixed(2)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-accent disabled:opacity-50"
                      disabled={loading}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-accent disabled:opacity-50"
                      disabled={loading}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="text-sm font-bold text-deep-blue">
                    ${(Number(product.price || 0) * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-3 bg-background">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold text-foreground">${subtotal.toFixed(2)}</span>
            </div>

            {/* Tax & Shipping Note */}
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout
            </p>

            {/* Total */}
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-deep-blue">${subtotal.toFixed(2)}</span>
            </div>

            <Button
              className="w-full text-base font-semibold py-6"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Processing..." : "Checkout"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
