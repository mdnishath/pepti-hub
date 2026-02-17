"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuthStore } from "@/store/useAuthStore";
import { getFullImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const {
    cart,
    loading: isLoading,
    fetchCart,
    updateQuantity,
    removeItem,
    itemCount,
    subtotal,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [cartInitialized, setCartInitialized] = useState(false);

  // Auth check effect
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, _hasHydrated, router]);

  // Fetch cart only once after auth is confirmed
  useEffect(() => {
    if (!loading && isAuthenticated && !cartInitialized) {
      fetchCart();
      setCartInitialized(true);
    }
  }, [loading, isAuthenticated, cartInitialized, fetchCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (confirm("Are you sure you want to remove this item from your cart?")) {
      await removeItem(itemId);
    }
  };

  // Calculate totals
  const taxRate = 0.1; // 10% tax
  const tax = subtotal * taxRate;
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  if (!_hasHydrated || loading) {
    return (
      
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading cart...</p>
          </div>
        </div>
      
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const items = cart?.items || [];

  return (
    
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container py-8">
            <Link
              href="/shop"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {itemCount === 0 ? "Your cart is empty" : `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
            </p>
          </div>
        </div>

        <div className="container py-8">
          {items.length === 0 ? (
            // Empty Cart State
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Link href="/shop">
                <Button size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        const imageUrl = getFullImageUrl(
                          product.thumbnail || product.images?.[0]
                        );
                        const itemTotal = Number(product.price || 0) * item.quantity;

                        return (
                          <div
                            key={item.id}
                            className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            {/* Product Image */}
                            <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.nextElementSibling;
                                    if (fallback) (fallback as HTMLElement).style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ display: imageUrl ? "none" : "flex" }}
                              >
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">
                                ${Number(product.price || 0).toFixed(2)} each
                              </p>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={isLoading || item.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value);
                                    if (!isNaN(qty) && qty >= 1) {
                                      handleUpdateQuantity(item.id, qty);
                                    }
                                  }}
                                  className="h-8 w-16 text-center"
                                  disabled={isLoading}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={isLoading}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Item Total & Remove */}
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-lg font-bold text-gray-900">
                                ${itemTotal.toFixed(2)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Subtotal */}
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>

                      {/* Shipping */}
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping:</span>
                        <span className="font-medium">
                          {shipping === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `$${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      {shipping > 0 && subtotal < 100 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                          </p>
                        </div>
                      )}

                      {/* Tax */}
                      <div className="flex justify-between text-gray-700">
                        <span>Tax (10%):</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Checkout Button */}
                      <Link href="/checkout">
                        <Button className="w-full" size="lg" disabled={isLoading}>
                          Proceed to Checkout
                        </Button>
                      </Link>

                      <Link href="/shop">
                        <Button variant="outline" className="w-full" size="lg">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Continue Shopping
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    
  );
}
