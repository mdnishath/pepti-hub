"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { ordersAPI, type Order } from "@/lib/api";
import { Package, ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AccountDashboard() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before checking auth
    if (!_hasHydrated) {
      console.log("🔵 Dashboard: Waiting for hydration...");
      return;
    }

    console.log("🔵 Dashboard: Hydration complete, checking auth status", { isAuthenticated, user });

    if (!isAuthenticated) {
      console.log("🔵 Dashboard: Not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, _hasHydrated, router, user]);

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;

      try {
        setLoadingOrders(true);
        const userOrders = await ordersAPI.getAll();
        // Filter to only current user's orders (backend should handle this but just in case)
        setOrders(userOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  // Show minimal loading while hydrating or checking auth - don't show dashboard layout
  if (!_hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">
            {!_hasHydrated ? "Loading..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border-b border-border">
        <div className="container py-10 md:py-14 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-deep-blue tracking-tight">My Account</h1>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="container py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-14">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-deep-blue mb-4">Order History</h2>

            {loadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  You haven't placed any orders yet.{" "}
                  <Link href="/catalog" className="text-primary hover:underline">
                    Browse catalog
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/account/order/${order.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            Order #{order.orderNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            order.status === 'DELIVERED' ? 'default' :
                            order.status === 'CANCELLED' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {order.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                          {order.status === 'DELIVERED' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {order.status === 'CANCELLED' && <XCircle className="w-3 h-3 mr-1" />}
                          {order.status === 'PROCESSING' && <Package className="w-3 h-3 mr-1" />}
                          {order.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          View details →
                        </div>
                        <div className="text-base font-bold text-deep-blue">
                          ${Number(order.total).toFixed(2)}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="ml-1 font-medium">{order.paymentStatus}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Method:</span>
                            <span className="ml-1 font-medium">{order.paymentMethod || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-deep-blue mb-4">Account Details</h2>
            <Card className="p-5 space-y-3">
              <p className="text-sm font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Role
                </p>
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
