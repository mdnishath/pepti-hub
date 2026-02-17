"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, MoreHorizontal, Edit, Trash2, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ordersAPI,
  type Order,
  type CreateOrderRequest,
  type UpdateOrderRequest,
  type OrderAddress,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api";

export default function OrdersPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    shippingAddress: OrderAddress;
    billingAddress?: OrderAddress;
    customerNote: string;
    paymentMethod: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    adminNote?: string;
  }>({
    shippingAddress: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
    customerNote: "",
    paymentMethod: "credit_card",
  });

  const loadOrders = async () => {
    try {
      setLoadingData(true);
      const data = await ordersAPI.getAll();
      console.log("Orders API response:", data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load orders:", error);
      toast.error(error.response?.data?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.push("/account/dashboard");
      return;
    }
    setLoading(false);
    loadOrders();
  }, [isAuthenticated, _hasHydrated, router, user]);

  if (!_hasHydrated || loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return null;
  }

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        customerNote: order.customerNote || "",
        paymentMethod: order.paymentMethod || "credit_card",
        status: order.status,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber || "",
        adminNote: order.adminNote || "",
      });
    } else {
      setEditingOrder(null);
      setFormData({
        shippingAddress: {
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        },
        customerNote: "",
        paymentMethod: "credit_card",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingOrder) {
        const updateData: UpdateOrderRequest = {
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          trackingNumber: formData.trackingNumber || undefined,
          adminNote: formData.adminNote || undefined,
        };
        console.log("Updating order:", editingOrder.id, updateData);
        await ordersAPI.update(editingOrder.id, updateData);
        toast.success("Order updated successfully!");
      } else {
        const createData: CreateOrderRequest = {
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.billingAddress,
          customerNote: formData.customerNote || undefined,
          paymentMethod: formData.paymentMethod || undefined,
        };
        console.log("Creating order:", createData);
        await ordersAPI.create(createData);
        toast.success("Order created successfully!");
      }
      await loadOrders();
      setIsDialogOpen(false);
      setEditingOrder(null);
    } catch (error: any) {
      console.error("Failed to save order:", error);
      toast.error(error.response?.data?.message || "Failed to save order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setDeletingOrderId(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrderId) return;

    try {
      await ordersAPI.delete(deletingOrderId);
      toast.success("Order deleted successfully!");
      await loadOrders();
      setIsDeleteDialogOpen(false);
      setDeletingOrderId(null);
    } catch (error: any) {
      console.error("Failed to delete order:", error);
      toast.error(error.response?.data?.message || "Failed to delete order. Please try again.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      CONFIRMED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      PROCESSING: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      SHIPPED: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      DELIVERED: "bg-green-100 text-green-800 hover:bg-green-100",
      CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100",
      REFUNDED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (paymentStatus: PaymentStatus) => {
    const colors = {
      UNPAID: "bg-red-100 text-red-800 hover:bg-red-100",
      PAID: "bg-green-100 text-green-800 hover:bg-green-100",
      PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      REFUNDED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return <Badge className={colors[paymentStatus]}>{paymentStatus}</Badge>;
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.user?.email && order.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Orders</h1>
            <p className="text-gray-400 mt-1">Manage customer orders</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white border-0">
            <Package className="w-4 h-4" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      <Card className="bg-dark-bg-card border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100">All Orders</CardTitle>
              <CardDescription className="text-gray-400">Manage all customer orders ({orders.length} total)</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search by order number or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Package className="w-4 h-4 mr-2" />
                Create Your First Order
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-white/5">
                  <TableHead className="text-gray-400">Order Number</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Total</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Payment</TableHead>
                  <TableHead className="text-gray-400">Date</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <p className="font-medium text-gray-100">{order.orderNumber}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-100">{order.shippingAddress.fullName}</p>
                        {order.user?.email && (
                          <p className="text-sm text-gray-400">{order.user.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-100">
                      ${Number(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-dark-bg-card border-white/10 text-gray-100">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleOpenDialog(order)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                            onClick={() => handleDeleteClick(order.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-dark-bg-card border-white/10 text-gray-100 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editingOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingOrder
                ? "Update the order details below."
                : "Fill in the details to create a new order."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {editingOrder ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-gray-300">Order Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as OrderStatus })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                        <SelectItem value="PENDING" className="focus:bg-white/10 focus:text-white cursor-pointer">Pending</SelectItem>
                        <SelectItem value="CONFIRMED" className="focus:bg-white/10 focus:text-white cursor-pointer">Confirmed</SelectItem>
                        <SelectItem value="PROCESSING" className="focus:bg-white/10 focus:text-white cursor-pointer">Processing</SelectItem>
                        <SelectItem value="SHIPPED" className="focus:bg-white/10 focus:text-white cursor-pointer">Shipped</SelectItem>
                        <SelectItem value="DELIVERED" className="focus:bg-white/10 focus:text-white cursor-pointer">Delivered</SelectItem>
                        <SelectItem value="CANCELLED" className="focus:bg-white/10 focus:text-white cursor-pointer">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED" className="focus:bg-white/10 focus:text-white cursor-pointer">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentStatus" className="text-gray-300">Payment Status</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as PaymentStatus })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                        <SelectItem value="UNPAID" className="focus:bg-white/10 focus:text-white cursor-pointer">Unpaid</SelectItem>
                        <SelectItem value="PAID" className="focus:bg-white/10 focus:text-white cursor-pointer">Paid</SelectItem>
                        <SelectItem value="PARTIALLY_PAID" className="focus:bg-white/10 focus:text-white cursor-pointer">Partially Paid</SelectItem>
                        <SelectItem value="REFUNDED" className="focus:bg-white/10 focus:text-white cursor-pointer">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trackingNumber" className="text-gray-300">Tracking Number</Label>
                    <Input
                      id="trackingNumber"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                      placeholder="TRACK123456"
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminNote" className="text-gray-300">Admin Note</Label>
                    <Textarea
                      id="adminNote"
                      value={formData.adminNote}
                      onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
                      placeholder="Internal notes for admins..."
                      rows={3}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-100">Shipping Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.shippingAddress.fullName}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, fullName: e.target.value }
                          })}
                          required
                          className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone" className="text-gray-300">Phone *</Label>
                        <Input
                          id="phone"
                          value={formData.shippingAddress.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, phone: e.target.value }
                          })}
                          required
                          className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="addressLine1" className="text-gray-300">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        value={formData.shippingAddress.addressLine1}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, addressLine1: e.target.value }
                        })}
                        required
                        className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="addressLine2" className="text-gray-300">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={formData.shippingAddress.addressLine2}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, addressLine2: e.target.value }
                        })}
                        className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city" className="text-gray-300">City *</Label>
                        <Input
                          id="city"
                          value={formData.shippingAddress.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                          })}
                          required
                          className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="state" className="text-gray-300">State *</Label>
                        <Input
                          id="state"
                          value={formData.shippingAddress.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                          })}
                          required
                          className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="zipCode" className="text-gray-300">Zip Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.shippingAddress.zipCode}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value }
                          })}
                          required
                          className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country" className="text-gray-300">Country *</Label>
                      <Input
                        id="country"
                        value={formData.shippingAddress.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                        })}
                        required
                        className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerNote" className="text-gray-300">Customer Note</Label>
                    <Textarea
                      id="customerNote"
                      value={formData.customerNote}
                      onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                      placeholder="Special delivery instructions..."
                      rows={2}
                      className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod" className="text-gray-300">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                        <SelectItem value="credit_card" className="focus:bg-white/10 focus:text-white cursor-pointer">Credit Card</SelectItem>
                        <SelectItem value="debit_card" className="focus:bg-white/10 focus:text-white cursor-pointer">Debit Card</SelectItem>
                        <SelectItem value="paypal" className="focus:bg-white/10 focus:text-white cursor-pointer">PayPal</SelectItem>
                        <SelectItem value="bank_transfer" className="focus:bg-white/10 focus:text-white cursor-pointer">Bank Transfer</SelectItem>
                        <SelectItem value="cash_on_delivery" className="focus:bg-white/10 focus:text-white cursor-pointer">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSubmitting ? "Saving..." : editingOrder ? "Update Order" : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
