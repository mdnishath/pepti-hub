"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  PackageCheck,
  PackageX,
  DollarSign,
} from "lucide-react";
import { productsAPI, categoriesAPI, type Product, type Category, type CreateProductRequest, type UpdateProductRequest, type Media } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getFullImageUrl } from "@/lib/utils";

export default function ProductsPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: 0,
    stock: 0,
    sku: "",
    categoryId: "",
    chemicalName: "",
    casNumber: "",
    purity: "",
    molecularFormula: "",
    sequence: "",
    productForm: "Lyophilized Powder",
    researchNotice: "",
    images: [],
  });
  const [imageUrlsInput, setImageUrlsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

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
    loadProducts();
    loadCategories();
  }, [isAuthenticated, _hasHydrated, router, user]);

  const loadProducts = async () => {
    try {
      setLoadingData(true);
      const data = await productsAPI.getAll();
      console.log("Products API response:", data);
      // Ensure data is an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error(error.response?.data?.message || "Failed to load products");
      setProducts([]); // Set empty array on error
    } finally {
      setLoadingData(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      console.log("Categories API response:", data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      toast.error(error.response?.data?.message || "Failed to load categories");
      setCategories([]);
    }
  };

  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      shortDescription: "",
      price: 0,
      stock: 0,
      sku: "",
      categoryId: "",
      chemicalName: "",
      casNumber: "",
      purity: "",
      molecularFormula: "",
      sequence: "",
      productForm: "Lyophilized Powder",
      researchNotice: "",
      images: [],
    });
    setImageUrlsInput("");
    setSelectedImages([]);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: product.price,
      stock: product.stock,
      sku: product.sku || "",
      categoryId: product.categoryId || "",
      chemicalName: product.chemicalName || "",
      casNumber: product.casNumber || "",
      purity: product.purity || "",
      molecularFormula: product.molecularFormula || "",
      sequence: product.sequence || "",
      productForm: product.productForm || "Lyophilized Powder",
      researchNotice: product.researchNotice || "",
      images: product.images || [],
    });
    setImageUrlsInput(product.images?.join(", ") || "");
    setSelectedImages(product.images || []);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (productId: string) => {
    setDeletingProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const handleSetThumbnail = (index: number) => {
    if (index === 0) return; // Already thumbnail
    const newImages = [...selectedImages];
    const [thumbnailImage] = newImages.splice(index, 1);
    newImages.unshift(thumbnailImage);
    setSelectedImages(newImages);
    toast.success("Thumbnail image updated");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return;

    try {
      await productsAPI.delete(deletingProductId);
      await loadProducts();
      toast.success("Product deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingProductId(null);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error(error.response?.data?.message || "Failed to delete product. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use selectedImages from MediaPicker if available, otherwise parse from manual input
      let imageUrls = selectedImages.length > 0 ? selectedImages : [];

      // If no images from picker, try to parse from manual input
      if (imageUrls.length === 0 && imageUrlsInput.trim()) {
        imageUrls = imageUrlsInput
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);
      }

      if (editingProduct) {
        // For update, send the fields that can be updated including images
        const updateData: UpdateProductRequest = {
          name: formData.name,
          description: formData.description || formData.name,
          shortDescription: formData.shortDescription || undefined,
          price: formData.price,
          stock: formData.stock,
          sku: formData.sku,
          chemicalName: formData.chemicalName || undefined,
          casNumber: formData.casNumber || undefined,
          purity: formData.purity || undefined,
          molecularFormula: formData.molecularFormula || undefined,
          sequence: formData.sequence || undefined,
          productForm: formData.productForm || undefined,
          researchNotice: formData.researchNotice || undefined,
          categoryId: formData.categoryId || categories[0]?.id,
          images: imageUrls.length > 0 ? imageUrls : undefined, // Only send if images were selected
        };

        console.log("Updating product:", editingProduct.id, updateData);
        await productsAPI.update(editingProduct.id, updateData);
      } else {
        // For create, send all required fields with auto-generated values
        const createData: CreateProductRequest = {
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || formData.name,
          shortDescription: formData.shortDescription,
          price: formData.price,
          stock: formData.stock,
          sku: formData.sku || `SKU-${Date.now()}`,
          chemicalName: formData.chemicalName,
          casNumber: formData.casNumber,
          purity: formData.purity,
          molecularFormula: formData.molecularFormula,
          sequence: formData.sequence,
          productForm: formData.productForm,
          researchNotice: formData.researchNotice,
          categoryId: formData.categoryId || categories[0]?.id,
          images: imageUrls,
        };

        console.log("Creating product:", createData);
        await productsAPI.create(createData);
      }

      await loadProducts();
      toast.success(editingProduct ? "Product updated successfully" : "Product created successfully");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setImageUrlsInput("");
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(error.response?.data?.message || "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);

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

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Products</h1>
          <p className="text-gray-400 mt-1">Manage your product inventory</p>
        </div>
        <Button onClick={handleAddProduct} className="bg-brand-600 hover:bg-brand-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-dark-bg-card border-white/5 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-bg-card border-white/5 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{activeProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <PackageCheck className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-bg-card border-white/5 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                <PackageX className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-bg-card border-white/5 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">${totalValue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 bg-dark-bg-card border-white/5 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="bg-dark-bg-card border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-100">All Products</CardTitle>
          <CardDescription className="text-gray-400">A list of all products in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-400">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Image</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Product</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">SKU</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Category</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Price</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Stock</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-300">Status</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const category = categories.find((c) => c.id === product.categoryId);
                    const thumbnail = product.thumbnail || product.images?.[0];
                    return (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative">
                            {thumbnail ? (
                              <img
                                src={getFullImageUrl(thumbnail)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                  if (fallback) (fallback as HTMLElement).style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="fallback-icon w-full h-full flex items-center justify-center absolute inset-0 bg-dark-bg-lighter"
                              style={{ display: thumbnail ? "none" : "flex" }}
                            >
                              <Package className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-200 group-hover:text-brand-300 transition-colors">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-xs">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-400 font-mono text-xs">{product.sku || "-"}</td>
                        <td className="py-4 px-4">
                          {category ? (
                            <Badge variant="outline" className="border-white/10 text-gray-400 bg-white/5">{category.name}</Badge>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-200 font-medium">
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock === 0
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : product.stock < 10
                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                : "bg-green-500/10 text-green-400 border border-green-500/20"
                              }`}
                          >
                            {product.stock} units
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={product.isActive ? "bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border-brand-500/20" : "bg-gray-500/20 text-gray-400 border-gray-500/20"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-dark-bg-card border-white/10 text-gray-200">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={() => handleEditProduct(product)} className="focus:bg-white/10 focus:text-white">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(product.id)}
                                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-bg-card border-white/10 text-gray-100 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingProduct
                ? "Update the product information below."
                : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-gray-300">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chemicalName" className="text-gray-300">Chemical Name</Label>
                  <Input
                    id="chemicalName"
                    value={formData.chemicalName || ""}
                    onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                    placeholder="e.g., Pentapeptide-18"
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="casNumber" className="text-gray-300">CAS Number</Label>
                  <Input
                    id="casNumber"
                    value={formData.casNumber || ""}
                    onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
                    placeholder="e.g., 64963-01-5"
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purity" className="text-gray-300">Purity</Label>
                  <Input
                    id="purity"
                    value={formData.purity || ""}
                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                    placeholder="e.g., ≥99% HPLC"
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Molecular Formula */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="molecularFormula" className="text-gray-300">Molecular Formula</Label>
                  <Input
                    id="molecularFormula"
                    value={formData.molecularFormula || ""}
                    onChange={(e) => setFormData({ ...formData, molecularFormula: e.target.value })}
                    placeholder="e.g., C₁₀₃H₁₆₃N₃₁O₃₂"
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sequence" className="text-gray-300">Amino Acid Sequence</Label>
                  <Input
                    id="sequence"
                    value={formData.sequence || ""}
                    onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                    placeholder="e.g., Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln..."
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productForm" className="text-gray-300">Product Form</Label>
                <Select
                  value={formData.productForm || "Lyophilized Powder"}
                  onValueChange={(value) => setFormData({ ...formData, productForm: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                    <SelectValue placeholder="Select product form..." />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                    <SelectItem value="Lyophilized Powder" className="focus:bg-white/10 focus:text-white cursor-pointer">Lyophilized Powder</SelectItem>
                    <SelectItem value="Liquid" className="focus:bg-white/10 focus:text-white cursor-pointer">Liquid</SelectItem>
                    <SelectItem value="Capsule" className="focus:bg-white/10 focus:text-white cursor-pointer">Capsule</SelectItem>
                    <SelectItem value="Tablet" className="focus:bg-white/10 focus:text-white cursor-pointer">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="researchNotice" className="text-gray-300">Research Notice</Label>
                <Textarea
                  id="researchNotice"
                  value={formData.researchNotice || ""}
                  onChange={(e) => setFormData({ ...formData, researchNotice: e.target.value })}
                  rows={4}
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Long Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription" className="text-gray-300">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription || ""}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Product Images</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Images from Library
                </Button>

                {/* Selected Images Grid */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {selectedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden bg-white/5 border border-white/10">
                          <img
                            src={getFullImageUrl(url)}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%231f2937' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 ? (
                          <div className="absolute bottom-1 left-1 bg-brand-500 text-white text-xs px-2 py-0.5 rounded">
                            Thumbnail
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(index)}
                            className="absolute bottom-1 left-1 bg-gray-900/90 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                          >
                            Set as Thumbnail
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-dark-bg-card px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Label htmlFor="imageUrls" className="text-gray-300">Enter image URLs manually</Label>
                <Textarea
                  id="imageUrls"
                  value={imageUrlsInput}
                  onChange={(e) => setImageUrlsInput(e.target.value)}
                  placeholder="Enter image URLs separated by commas..."
                  rows={2}
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
                <p className="text-xs text-gray-500">
                  Example: https://example.com/image1.jpg, https://example.com/image2.jpg
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-300">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-gray-300">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="focus:bg-white/10 focus:text-white cursor-pointer">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this product? This action cannot be undone.
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
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MediaPicker Component */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(media) => {
          if (Array.isArray(media)) {
            const urls = media.map(m => m.url);
            setSelectedImages(urls);
          }
        }}
        multiple={true}
        type="IMAGE"
      />
    </>
  );
}
