import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Always add tenant ID header if not already present
    if (!config.headers['x-tenant-id']) {
      config.headers['x-tenant-id'] = 'pepti-hub';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // Clear cookies and redirect to login
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }

    // Silently handle 403 for tenant endpoint - don't show error in console
    if (error.response?.status === 403 && error.config?.url?.includes('/tenants/slug/')) {
      // Suppress the error - it's already handled in useTenantStore with fallback
      console.log('Tenant endpoint requires admin access - using default tenant data');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    console.log('🔵 API: Calling POST /auth/login', data);
    const response = await api.post('/auth/login', data, {
      headers: { 'x-tenant-id': 'pepti-hub' },
    });
    console.log('🔵 API: Login response received', response.data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    console.log('🔵 API: Calling POST /auth/register', { ...data, password: '***' });
    // Send only the required fields (email, password, firstName, lastName)
    // tenantId goes in header, not body
    const registerData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    const response = await api.post('/auth/register', registerData, {
      headers: { 'x-tenant-id': 'pepti-hub' },
    });
    console.log('🔵 API: Register response received', response.data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    // Cookies will be cleared by the store
  },
};

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  chemicalName?: string | null;
  casNumber?: string | null;
  purity?: string | null;
  molecularFormula?: string | null;
  sequence?: string | null;
  productForm?: string | null;
  researchNotice?: string | null;
  categoryId: string | null;
  tenantId: string;
  isActive: boolean;
  images: string[];
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string } | null;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  chemicalName?: string;
  casNumber?: string;
  purity?: string;
  molecularFormula?: string;
  sequence?: string;
  productForm?: string;
  researchNotice?: string;
  categoryId: string;
  images: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  chemicalName?: string;
  casNumber?: string;
  purity?: string;
  molecularFormula?: string;
  sequence?: string;
  productForm?: string;
  researchNotice?: string;
  categoryId?: string;
  images?: string[];
  isActive?: boolean;
}

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    // Backend wraps response in {data: [], meta: {}}
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Order Types
export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  trackingNumber?: string;
  paymentMethod?: string;
  paymentId?: string;
  customerNote?: string;
  adminNote?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CreateOrderRequest {
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  customerNote?: string;
  paymentMethod?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  adminNote?: string;
}

// Orders API
export const ordersAPI = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateOrderRequest): Promise<Order> => {
    const response = await api.patch(`/orders/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

// Users API
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  isActive?: boolean;
}

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Categories API
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive?: boolean;
}

export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// Stats API for Dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  usersChange: number;
}

export const statsAPI = {
  getDashboard: async (): Promise<DashboardStats> => {
    // Since backend doesn't have a stats endpoint, we'll aggregate client-side
    const [products, orders, users] = await Promise.all([
      productsAPI.getAll(),
      ordersAPI.getAll(),
      usersAPI.getAll(),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalUsers: users.length,
      revenueChange: 20.1,
      ordersChange: 15.3,
      productsChange: 5.2,
      usersChange: 12.8,
    };
  },
};

// Tenant Types
export type Plan = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo: string | null;
  favicon: string | null;
  primaryColor: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  currency: string;
  taxRate: number;
  stripeKey: string | null;
  sslcommerzKey: string | null;
  emailFrom: string | null;
  smtpConfig: SMTPConfig | null;
  contactNotificationEmail: string | null;
  orderNotificationEmail: string | null;
  isActive: boolean;
  plan: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  currency?: string;
  taxRate?: number;
  plan?: Plan;
  isActive?: boolean;
  stripeKey?: string;
  sslcommerzKey?: string;
  emailFrom?: string;
  contactNotificationEmail?: string;
  orderNotificationEmail?: string;
  smtpConfig?: SMTPConfig;
}

// Tenants API
export const tenantsAPI = {
  // Get current tenant by slug
  getBySlug: async (slug: string): Promise<Tenant> => {
    const response = await api.get(`/tenants/slug/${slug}`);
    return response.data;
  },

  // Get tenant by ID (admin only - returns full data including sensitive config)
  findOne: async (id: string): Promise<Tenant> => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  // Update tenant by ID
  update: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    const response = await api.patch(`/tenants/${id}`, data);
    return response.data;
  },
};

// Media Types
export type MediaFileType = 'IMAGE' | 'VIDEO';

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: MediaFileType;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Media API
export const mediaAPI = {
  // Get all media files
  getAll: async (type?: MediaFileType): Promise<Media[]> => {
    const params = type ? { type } : {};
    const response = await api.get('/media', { params });
    return response.data;
  },

  // Get single media file
  getById: async (id: string): Promise<Media> => {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  // Upload single file
  upload: async (file: File): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload multiple files
  uploadMultiple: async (files: File[]): Promise<Media[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/media/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete media file
  delete: async (id: string): Promise<void> => {
    await api.delete(`/media/${id}`);
  },
};

// Cart Types
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface Cart {
  id: string;
  userId?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  items: CartItem[];
  itemCount?: number;
  subtotal?: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Cart API
export const cartAPI = {
  // Get current user's cart
  get: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addItem: async (data: AddToCartRequest): Promise<Cart> => {
    const response = await api.post('/cart/items', data);
    return response.data;
  },

  // Update cart item quantity
  updateItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    const response = await api.patch(`/cart/items/${itemId}`, data);
    return response.data;
  },

  // Remove item from cart
  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  // Clear entire cart
  clear: async (): Promise<void> => {
    await api.delete('/cart');
  },
};

// ==================== CONTACT ====================
export interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  tenantId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface UpdateContactRequest {
  isRead?: boolean;
}

export interface ContactStats {
  total: number;
  unread: number;
  read: number;
}

// Contact API
export const contactAPI = {
  // Submit contact form (Public)
  create: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await api.post('/contact', data);
    return response.data;
  },

  // Get all contacts (Admin only)
  getAll: async (isRead?: boolean): Promise<Contact[]> => {
    const params = isRead !== undefined ? { isRead } : {};
    const response = await api.get('/contact', { params });
    return response.data;
  },

  // Get contact stats (Admin only)
  getStats: async (): Promise<ContactStats> => {
    const response = await api.get('/contact/stats');
    return response.data;
  },

  // Get single contact (Admin only)
  getById: async (id: string): Promise<Contact> => {
    const response = await api.get(`/contact/${id}`);
    return response.data;
  },

  // Update contact (Admin only)
  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const response = await api.patch(`/contact/${id}`, data);
    return response.data;
  },

  // Delete contact (Admin only)
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/contact/${id}`);
    return response.data;
  },
};

// ==================== QUALITY IMAGES ====================
export interface QualityImage {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  order: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityImageRequest {
  title: string;
  description?: string;
  imageUrl: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateQualityImageRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
}

// Quality Images API
export const qualityImagesAPI = {
  // Get all quality images
  getAll: async (isActive?: boolean): Promise<QualityImage[]> => {
    const params = isActive !== undefined ? { isActive } : {};
    const response = await api.get('/quality-images', { params });
    return response.data.data || response.data;
  },

  // Get single quality image
  getById: async (id: string): Promise<QualityImage> => {
    const response = await api.get(`/quality-images/${id}`);
    return response.data.data || response.data;
  },

  // Create quality image (Admin only)
  create: async (data: CreateQualityImageRequest): Promise<QualityImage> => {
    const response = await api.post('/quality-images', data);
    return response.data.data || response.data;
  },

  // Update quality image (Admin only)
  update: async (id: string, data: UpdateQualityImageRequest): Promise<QualityImage> => {
    const response = await api.patch(`/quality-images/${id}`, data);
    return response.data.data || response.data;
  },

  // Reorder quality image (Admin only)
  reorder: async (id: string, order: number): Promise<QualityImage> => {
    const response = await api.patch(`/quality-images/${id}/reorder`, { order });
    return response.data.data || response.data;
  },

  // Delete quality image (Admin only)
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/quality-images/${id}`);
    return response.data;
  },
};

// ==================== BUNDLES ====================
export interface BundleProduct {
  id: string;
  bundleId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  discount: number;
  originalPrice: number;
  finalPrice: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  products: BundleProduct[];
}

export interface CreateBundleRequest {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  discount: number;
  products: {
    productId: string;
    quantity: number;
  }[];
  isActive?: boolean;
}

export interface UpdateBundleRequest {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  discount?: number;
  products?: {
    productId: string;
    quantity: number;
  }[];
  isActive?: boolean;
}

// Bundles API
export const bundlesAPI = {
  // Get all bundles
  getAll: async (isActive?: boolean): Promise<Bundle[]> => {
    const params = isActive !== undefined ? { isActive } : {};
    const response = await api.get('/bundles', { params });
    return response.data.data || response.data;
  },

  // Get single bundle by ID
  getById: async (id: string): Promise<Bundle> => {
    const response = await api.get(`/bundles/${id}`);
    return response.data.data || response.data;
  },

  // Get bundle by slug
  getBySlug: async (slug: string): Promise<Bundle> => {
    const response = await api.get(`/bundles/slug/${slug}`);
    return response.data.data || response.data;
  },

  // Create bundle (Admin only)
  create: async (data: CreateBundleRequest): Promise<Bundle> => {
    const response = await api.post('/bundles', data);
    return response.data.data || response.data;
  },

  // Update bundle (Admin only)
  update: async (id: string, data: UpdateBundleRequest): Promise<Bundle> => {
    const response = await api.patch(`/bundles/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete bundle (Admin only)
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/bundles/${id}`);
    return response.data;
  },
};
