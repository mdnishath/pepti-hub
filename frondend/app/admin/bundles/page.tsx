"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Gift,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  X,
  Eye,
  EyeOff,
  DollarSign,
} from "lucide-react";
import {
  bundlesAPI,
  productsAPI,
  type Bundle,
  type Product,
  type CreateBundleRequest,
  type UpdateBundleRequest,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { toast } from "sonner";

interface BundleProductInput {
  productId: string;
  quantity: number;
}

export default function BundlesPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBundleRequest>({
    name: "",
    slug: "",
    description: "",
    image: "",
    discount: 0,
    products: [],
    isActive: true,
  });
  const [bundleProducts, setBundleProducts] = useState<BundleProductInput[]>([{ productId: "", quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const getFullImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `http://localhost:3001${url}`;
    return url;
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
    loadBundles();
    loadProducts();
  }, [isAuthenticated, _hasHydrated, router, user]);

  const loadBundles = async () => {
    try {
      setLoadingData(true);
      const data = await bundlesAPI.getAll();
      console.log("Bundles API response:", data);
      setBundles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load bundles:", error);
      toast.error(error.response?.data?.message || "Failed to load bundles");
      setBundles([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error(error.response?.data?.message || "Failed to load products");
      setProducts([]);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleAddBundle = () => {
    setEditingBundle(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      discount: 0,
      products: [],
      isActive: true,
    });
    setBundleProducts([{ productId: "", quantity: 1 }]);
    setIsDialogOpen(true);
  };

  const handleEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description || "",
      image: bundle.image || "",
      discount: Number(bundle.discount),
      products: bundle.products.map((bp) => ({
        productId: bp.productId,
        quantity: bp.quantity,
      })),
      isActive: bundle.isActive,
    });
    setBundleProducts(
      bundle.products.map((bp) => ({
        productId: bp.productId,
        quantity: bp.quantity,
      }))
    );
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (bundleId: string) => {
    setDeletingBundleId(bundleId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBundleId) return;
    try {
      await bundlesAPI.delete(deletingBundleId);
      await loadBundles();
      toast.success("Bundle deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingBundleId(null);
    } catch (error: any) {
      console.error("Failed to delete bundle:", error);
      toast.error(error.response?.data?.message || "Failed to delete bundle");
    }
  };

  const addProductRow = () => {
    setBundleProducts([...bundleProducts, { productId: "", quantity: 1 }]);
  };

  const removeProductRow = (index: number) => {
    setBundleProducts(bundleProducts.filter((_, i) => i !== index));
  };

  const updateProductRow = (index: number, field: keyof BundleProductInput, value: string | number) => {
    const updated = [...bundleProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBundleProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validProducts = bundleProducts.filter((p) => p.productId && p.quantity > 0);

      if (validProducts.length === 0) {
        toast.error("Please add at least one product to the bundle");
        setIsSubmitting(false);
        return;
      }

      const bundleData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        products: validProducts,
      };

      if (editingBundle) {
        const updateData: UpdateBundleRequest = bundleData;
        await bundlesAPI.update(editingBundle.id, updateData);
      } else {
        const createData: CreateBundleRequest = bundleData;
        await bundlesAPI.create(createData);
      }

      await loadBundles();
      toast.success(editingBundle ? "Bundle updated successfully" : "Bundle created successfully");
      setIsDialogOpen(false);
      setEditingBundle(null);
    } catch (error: any) {
      console.error("Failed to save bundle:", error);
      toast.error(error.response?.data?.message || "Failed to save bundle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBundles = bundles.length;
  const activeBundles = bundles.filter((b) => b.isActive).length;
  const totalSavings = bundles.reduce(
    (sum, b) => sum + (Number(b.originalPrice) - Number(b.finalPrice)),
    0
  );

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Bundles</h1>
          <p className="text-gray-600 mt-1">Manage bundle & save offers</p>
        </div>
        <Button onClick={handleAddBundle} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Bundle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bundles</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalBundles}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bundles</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activeBundles}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${totalSavings.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bundles</CardTitle>
          <CardDescription>Manage your product bundle offers</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading bundles...</p>
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bundles found</p>
              <Button onClick={handleAddBundle} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Bundle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bundle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Products</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Discount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Original Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Final Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bundles.map((bundle) => (
                    <tr key={bundle.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {bundle.image ? (
                              <img
                                src={getFullImageUrl(bundle.image)}
                                alt={bundle.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Gift className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{bundle.name}</p>
                            <p className="text-sm text-gray-500">{bundle.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{bundle.products.length} products</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-green-100 text-green-800">{bundle.discount}% off</Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600 line-through">
                        ${Number(bundle.originalPrice).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-bold">
                        ${Number(bundle.finalPrice).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={bundle.isActive ? "default" : "secondary"}>
                          {bundle.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditBundle(bundle)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(bundle.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? "Edit Bundle" : "Add New Bundle"}</DialogTitle>
            <DialogDescription>
              {editingBundle
                ? "Update the bundle information below."
                : "Create a new product bundle with discount pricing."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bundle Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Starter Peptide Pack"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what's included in this bundle"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Bundle Image</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Image from Library
                </Button>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={getFullImageUrl(formData.image)}
                      alt="Bundle preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount Percentage *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Bundle Products *</Label>
                {bundleProducts.map((bp, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={bp.productId}
                      onValueChange={(value) => updateProductRow(index, "productId", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${Number(product.price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={bp.quantity}
                      onChange={(e) => updateProductRow(index, "quantity", parseInt(e.target.value))}
                      className="w-24"
                      placeholder="Qty"
                    />
                    {bundleProducts.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeProductRow(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addProductRow} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">{formData.isActive ? "Active" : "Inactive"}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingBundle ? "Update Bundle" : "Create Bundle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bundle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bundle? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(media) => {
          if (Array.isArray(media)) {
            if (media.length > 0) {
              setFormData({ ...formData, image: media[0].url });
            }
          } else {
            setFormData({ ...formData, image: media.url });
          }
        }}
        multiple={false}
        type="IMAGE"
      />
    </>
  );
}
