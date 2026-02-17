"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { ordersAPI, type Order, type OrderAddress } from "@/lib/api";
import { getFullImageUrl } from "@/lib/utils";

const AddressBlock = ({ title, address }: { title: string; address: OrderAddress }) => (
  <Card className="p-5 flex-1">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
    <p className="text-sm text-foreground leading-relaxed">
      {address.fullName}
      <br />{address.addressLine1}
      {address.addressLine2 && <><br />{address.addressLine2}</>}
      <br />{address.city}, {address.state} {address.zipCode}
      <br />{address.country}
      <br />Phone: {address.phone}
    </p>
  </Card>
);

export default function OrderDetail() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await ordersAPI.getById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, _hasHydrated, router]);

  if (loading) {
    return (
      <div className="container py-14 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-14 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/account/dashboard" className="text-primary hover:underline text-sm mt-2 inline-block">Back to Account</Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-10 md:py-14">
          <Link href="/account/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Account
          </Link>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">Order #{order.orderNumber}</h1>
            <span className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex gap-4">
            <Badge
              variant={
                order.status === 'DELIVERED' ? 'default' :
                order.status === 'CANCELLED' ? 'destructive' :
                'secondary'
              }
            >
              {order.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
              {order.status === 'DELIVERED' && <CheckCircle className="w-3 h-3 mr-1" />}
              {order.status === 'CANCELLED' && <XCircle className="w-3 h-3 mr-1" />}
              {order.status === 'PROCESSING' && <Package className="w-3 h-3 mr-1" />}
              {order.status}
            </Badge>
            <Badge variant="outline">
              Payment: {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container py-10 md:py-14 space-y-10">
        <div>
          <h2 className="text-lg font-bold text-deep-blue mb-4">Order Summary</h2>
          <Card className="p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping:</span>
                <span>{order.shipping === 0 ? 'Free' : `$${Number(order.shipping).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax:</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 text-base">
                <span>Total:</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {order.customerNote && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer Note</p>
                <p className="text-sm text-foreground">{order.customerNote}</p>
              </div>
            )}

            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tracking Number</p>
                <p className="text-sm font-mono text-foreground">{order.trackingNumber}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {order.billingAddress && <AddressBlock title="Billing Address" address={order.billingAddress} />}
          <AddressBlock title="Shipping Address" address={order.shippingAddress} />
        </div>
      </div>
    </>
  );
}
