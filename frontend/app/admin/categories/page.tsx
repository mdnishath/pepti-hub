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
import { Plus, Search, MoreHorizontal, Edit, Trash2, FolderTree, Image as ImageIcon } from "lucide-react";
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
import { categoriesAPI, type Category, type CreateCategoryRequest, type UpdateCategoryRequest } from "@/lib/api";
import { MediaPicker } from "@/components/admin/MediaPicker";

export default function CategoriesPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const loadCategories = async () => {
    try {
      setLoadingData(true);
      const data = await categoriesAPI.getAll();
      console.log("Categories API response:", data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      toast.error(error.response?.data?.message || "Failed to load categories");
      setCategories([]);
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
    loadCategories();
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

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        image: category.image || "",
      });
      setSelectedImage(category.image || "");
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        image: "",
      });
      setSelectedImage("");
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // For update, only send the fields that can be updated
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
          description: formData.description || undefined,
          image: formData.image || undefined,
        };
        console.log("Updating category:", editingCategory.id, updateData);
        await categoriesAPI.update(editingCategory.id, updateData);
        toast.success("Category updated successfully!");
      } else {
        // For create, send all required fields with auto-generated values
        const createData: CreateCategoryRequest = {
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description || undefined,
          image: formData.image || undefined,
        };
        console.log("Creating category:", createData);
        await categoriesAPI.create(createData);
        toast.success("Category created successfully!");
      }
      await loadCategories();
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      toast.error(error.response?.data?.message || "Failed to save category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, category: Category) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoriesAPI.delete(id);
      toast.success("Category deleted successfully!");
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);

      // Handle 409 Conflict errors with specific messages
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || "";

        if (errorMessage.includes("products")) {
          toast.error(
            `Cannot delete "${category.name}" - has ${category._count?.products || 0} product(s). Move or delete products first.`,
            { duration: 6000 }
          );
        } else if (errorMessage.includes("subcategories")) {
          toast.error(
            `Cannot delete "${category.name}" - has subcategories. Delete subcategories first.`,
            { duration: 6000 }
          );
        } else {
          toast.error("Cannot delete this category - may have associated products or subcategories.");
        }
      } else {
        toast.error(error.response?.data?.message || "Failed to delete category. Please try again.");
      }
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Organize your products into categories</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>Manage product categories ({categories.length} total)</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No categories found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FolderTree className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{cat.slug}</TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {cat._count?.products || 0}
                    </TableCell>
                    <TableCell>
                      {cat.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDialog(cat)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(cat.id, cat)}
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Fill in the details to create a new category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!editingCategory) {
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                    }
                  }}
                  required
                  placeholder="Category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug {!editingCategory && "*"}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required={!editingCategory}
                  disabled={!!editingCategory}
                  placeholder="category-slug"
                  className={editingCategory ? "bg-gray-50" : ""}
                />
                {editingCategory && (
                  <p className="text-xs text-gray-500">Slug cannot be changed after creation</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Category Image</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select from Library
                </Button>

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="relative w-full h-40 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={selectedImage}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Label htmlFor="image">Enter image URL manually</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setSelectedImage(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
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
                {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MediaPicker Component */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(media) => {
          if (!Array.isArray(media)) {
            setSelectedImage(media.url);
            setFormData({ ...formData, image: media.url });
          }
        }}
        multiple={false}
        type="IMAGE"
      />
    </>
  );
}
