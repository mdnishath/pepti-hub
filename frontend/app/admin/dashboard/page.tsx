"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ordersAPI,
  productsAPI,
  usersAPI,
  categoriesAPI,
  type DashboardStats,
  type Order,
  type Product,
} from "@/lib/api";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ElementType;
}

function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card className="bg-dark-bg-card border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 group-hover:text-brand-300 transition-colors">{title}</p>
            <p className="text-2xl font-bold text-gray-100 mt-2">{value}</p>
            <div className="flex items-center mt-2">
              {changeType === "increase" ? (
                <ArrowUpRight className="w-4 h-4 text-brand-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${changeType === "increase" ? "text-brand-400" : "text-red-400"
                  }`}
              >
                {change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500/20 to-brand-600/10 rounded-xl flex items-center justify-center border border-brand-500/20 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-brand-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch all required data
        const [products, orders, users, categories] = await Promise.all([
          productsAPI.getAll(),
          ordersAPI.getAll(),
          usersAPI.getAll(),
          categoriesAPI.getAll()
        ]);

        // 1. Calculate Dashboard Stats
        const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        // Calculate growth (mock logic for now as we don't have historical snapshots easily)
        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalUsers: users.length,
          revenueChange: 12.5, // Mock growth
          ordersChange: 8.2,   // Mock growth
          productsChange: 3.1, // Mock growth
          usersChange: 5.4     // Mock growth
        });

        // 2. Prepare Sales Over Time Data (Last 6 Months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            name: format(date, "MMM"),
            fullDate: date,
            sales: 0,
            orders: 0
          };
        });

        orders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          const monthData = last6Months.find(m =>
            format(orderDate, "MMM") === m.name &&
            orderDate.getFullYear() === m.fullDate.getFullYear()
          );

          if (monthData) {
            monthData.sales += order.total || 0;
            monthData.orders += 1;
          }
        });

        setSalesData(last6Months);

        // 3. Prepare Category Performance Data (Products per Category)
        const categoryCounts: Record<string, number> = {};

        products.forEach(product => {
          if (product.categoryId) {
            categoryCounts[product.categoryId] = (categoryCounts[product.categoryId] || 0) + 1;
          } else {
            categoryCounts['uncategorized'] = (categoryCounts['uncategorized'] || 0) + 1;
          }
        });

        const formattedCategoryData = Object.entries(categoryCounts).map(([catId, count]) => {
          const category = categories.find(c => c.id === catId);
          return {
            name: category ? category.name : (catId === 'uncategorized' ? 'Uncategorized' : 'Unknown'),
            value: count
          };
        }).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories

        setCategoryData(formattedCategoryData);

        // 4. Set Recent Items
        setRecentOrders(orders.slice(0, 5));
        setRecentProducts(products.slice(0, 5));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
          Dashboard Overview
        </h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue.toLocaleString() || '0'}`}
          change={`+${stats?.revenueChange}%`}
          changeType="increase"
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders.toString() || '0'}
          change={`+${stats?.ordersChange}%`}
          changeType="increase"
          icon={ShoppingCart}
        />
        <StatCard
          title="Active Products"
          value={stats?.totalProducts.toString() || '0'}
          change={`+${stats?.productsChange}%`}
          changeType="increase"
          icon={Package}
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers.toString() || '0'}
          change={`+${stats?.usersChange}%`}
          changeType="increase"
          icon={Users}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-4 bg-dark-bg-card border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-100">Sales Overview</CardTitle>
            <CardDescription className="text-gray-400">Monthly sales performance for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3db7c2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3db7c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#3db7c2' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3db7c2"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="lg:col-span-3 bg-dark-bg-card border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-100">Category Performance</CardTitle>
            <CardDescription className="text-gray-400">Top performing categories by product count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                      itemStyle={{ color: '#3db7c2' }}
                    />
                    <Bar dataKey="value" fill="#3db7c2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-500 flex flex-col items-center justify-center h-full">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="bg-dark-bg-card border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-100">Recent Orders</CardTitle>
          <CardDescription className="text-gray-400">Latest transactions from your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 sm:table-row hidden">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group flex flex-col sm:table-row mb-4 sm:mb-0 border border-white/5 sm:border-0 rounded-lg sm:rounded-none p-4 sm:p-0">
                      <td className="py-3 px-4 text-gray-100 sm:table-cell flex justify-between">
                        <span className="sm:hidden text-gray-400 text-sm">Order ID:</span>
                        <span className="font-medium">#{order.orderNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 sm:table-cell flex justify-between">
                        <span className="sm:hidden text-gray-400 text-sm">Customer:</span>
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                      </td>
                      <td className="py-3 px-4 text-gray-400 sm:table-cell flex justify-between">
                        <span className="sm:hidden text-gray-400 text-sm">Date:</span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 sm:table-cell flex justify-between">
                        <span className="sm:hidden text-gray-400 text-sm">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400' :
                            order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                              order.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-gray-500/10 text-gray-400'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-100 font-medium sm:table-cell flex justify-between">
                        <span className="sm:hidden text-gray-400 text-sm">Amount:</span>
                        ${order.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
