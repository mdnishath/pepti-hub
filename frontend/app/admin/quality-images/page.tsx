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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image as ImageIcon,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Award,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { qualityImagesAPI, type QualityImage, type CreateQualityImageRequest, type UpdateQualityImageRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { toast } from "sonner";

export default function QualityImagesPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [qualityImages, setQualityImages] = useState<QualityImage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<QualityImage | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateQualityImageRequest>({
    title: "",
    description: "",
    imageUrl: "",
    order: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Helper function to get full image URL
  const getFullImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `http://localhost:3001${url}`;
    }
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
    loadQualityImages();
  }, [isAuthenticated, _hasHydrated, router, user]);

  const loadQualityImages = async () => {
    try {
      setLoadingData(true);
      const data = await qualityImagesAPI.getAll();
      console.log("Quality Images API response:", data);
      setQualityImages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load quality images:", error);
      toast.error(error.response?.data?.message || "Failed to load quality images");
      setQualityImages([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddImage = () => {
    setEditingImage(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      order: qualityImages.length,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditImage = (image: QualityImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || "",
      imageUrl: image.imageUrl,
      order: image.order,
      isActive: image.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (imageId: string) => {
    setDeletingImageId(imageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingImageId) return;

    try {
      await qualityImagesAPI.delete(deletingImageId);
      await loadQualityImages();
      toast.success("Quality image deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingImageId(null);
    } catch (error: any) {
      console.error("Failed to delete quality image:", error);
      toast.error(error.response?.data?.message || "Failed to delete quality image. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingImage) {
        const updateData: UpdateQualityImageRequest = {
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          order: formData.order,
          isActive: formData.isActive,
        };

        console.log("Updating quality image:", editingImage.id, updateData);
        await qualityImagesAPI.update(editingImage.id, updateData);
      } else {
        const createData: CreateQualityImageRequest = {
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          order: formData.order,
          isActive: formData.isActive,
        };

        console.log("Creating quality image:", createData);
        await qualityImagesAPI.create(createData);
      }

      await loadQualityImages();
      toast.success(editingImage ? "Quality image updated successfully" : "Quality image created successfully");
      setIsDialogOpen(false);
      setEditingImage(null);
    } catch (error: any) {
      console.error("Failed to save quality image:", error);
      toast.error(error.response?.data?.message || "Failed to save quality image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (imageId: string, direction: "up" | "down") => {
    const currentImage = qualityImages.find((img) => img.id === imageId);
    if (!currentImage) return;

    const currentIndex = qualityImages.findIndex((img) => img.id === imageId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= qualityImages.length) return;

    try {
      // Update the order of the current image
      await qualityImagesAPI.reorder(imageId, newIndex);

      // Swap with adjacent image
      const adjacentImage = qualityImages[newIndex];
      await qualityImagesAPI.reorder(adjacentImage.id, currentIndex);

      await loadQualityImages();
      toast.success("Order updated successfully");
    } catch (error: any) {
      console.error("Failed to reorder:", error);
      toast.error(error.response?.data?.message || "Failed to reorder image");
    }
  };

  const totalImages = qualityImages.length;
  const activeImages = qualityImages.filter((img) => img.isActive).length;
  const inactiveImages = totalImages - activeImages;

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
          <h1 className="text-2xl font-bold text-gray-900">Quality Images</h1>
          <p className="text-gray-600 mt-1">Manage certificate of analysis and quality assurance images</p>
        </div>
        <Button onClick={handleAddImage} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Images</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalImages}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Images</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activeImages}</p>
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
                <p className="text-sm font-medium text-gray-600">Inactive Images</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{inactiveImages}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Images Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Quality Images</CardTitle>
          <CardDescription>Certificate of analysis and quality assurance images displayed on the quality page</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading quality images...</p>
            </div>
          ) : qualityImages.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quality images found</p>
              <Button onClick={handleAddImage} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qualityImages.map((image, index) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={getFullImageUrl(image.imageUrl)}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge variant={image.isActive ? "default" : "secondary"}>
                        {image.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        Order: {image.order}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{image.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(image.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(image.id, "down")}
                          disabled={index === qualityImages.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditImage(image)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(image.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Quality Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingImage ? "Edit Quality Image" : "Add New Quality Image"}</DialogTitle>
            <DialogDescription>
              {editingImage
                ? "Update the quality image information below."
                : "Fill in the details to add a new quality image."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Certificate of Analysis - Batch #12345"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this certificate or test result"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Image *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Image from Library
                </Button>

                {formData.imageUrl && (
                  <div className="mt-2">
                    <div className="aspect-video rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={getFullImageUrl(formData.imageUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
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

                <Label htmlFor="imageUrl">Enter image URL manually</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/certificate.jpg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      {formData.isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
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
                {isSubmitting ? "Saving..." : editingImage ? "Update Image" : "Create Image"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quality Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quality image? This action cannot be undone.
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

      {/* MediaPicker Component */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(media) => {
          if (Array.isArray(media)) {
            if (media.length > 0) {
              setFormData({ ...formData, imageUrl: media[0].url });
            }
          } else {
            setFormData({ ...formData, imageUrl: media.url });
          }
        }}
        multiple={false}
        type="IMAGE"
      />
    </>
  );
}
