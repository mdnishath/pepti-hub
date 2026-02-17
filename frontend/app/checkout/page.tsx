"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuthStore } from "@/store/useAuthStore";
import { getFullImageUrl } from "@/lib/utils";
import { ordersAPI, type CreateOrderRequest, type OrderAddress } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Package, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { cart, fetchCart, clearCart, subtotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    customerNote: "",
    paymentMethod: "card",
  });

  // Auth check effect
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setLoading(false);
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, _hasHydrated, router]);

  // Pre-fill user data only once
  useEffect(() => {
    if (user && !isFormInitialized) {
      setFormData((prev) => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || "",
      }));
      setIsFormInitialized(true);
    }
  }, [user, isFormInitialized]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);

    try {
      const shippingAddress: OrderAddress = {
        fullName: formData.fullName,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };

      const orderData: CreateOrderRequest = {
        shippingAddress,
        billingAddress: shippingAddress, // Same as shipping for now
        customerNote: formData.customerNote || undefined,
        paymentMethod: formData.paymentMethod,
      };

      const order = await ordersAPI.create(orderData);
      setOrderNumber(order.orderNumber);
      setOrderSuccess(true);

      // Clear cart after successful order
      await clearCart();

      toast.success("Order placed successfully!");

      // Redirect to order confirmation after a short delay
      setTimeout(() => {
        router.push(`/account/order/${order.id}`);
      }, 3000);
    } catch (error: any) {
      console.error("Failed to create order:", error);
      toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
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
            <p className="mt-4 text-sm text-gray-600">Loading checkout...</p>
          </div>
        </div>
      
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const items = cart?.items || [];

  // Order Success Screen
  if (orderSuccess) {
    return (
      
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-600 mb-4">
                Your order number is: <span className="font-semibold">{orderNumber}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                We've sent a confirmation email to {formData.email}
              </p>
              <Button onClick={() => router.push("/account/dashboard")} className="w-full">
                View My Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      
    );
  }

  // Empty cart redirect
  if (items.length === 0) {
    return (
      
        <div className="min-h-screen bg-gray-50">
          <div className="container py-16">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products before checking out.</p>
              <Link href="/shop">
                <Button size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container py-8">
            <Link
              href="/cart"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order</p>
          </div>
        </div>

        <div className="container py-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, country: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                      Payment will be processed after order confirmation
                    </p>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      name="customerNote"
                      value={formData.customerNote}
                      onChange={handleInputChange}
                      placeholder="Special instructions or notes about your order..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="max-h-64 overflow-y-auto space-y-3 pb-4 border-b">
                      {items.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        const imageUrl = getFullImageUrl(
                          product.thumbnail || product.images?.[0]
                        );

                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
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
                      <div className="flex justify-between text-gray-700">
                        <span>Tax (10%):</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? "Processing..." : "Place Order"}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By placing your order, you agree to our terms and conditions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    
  );
}
