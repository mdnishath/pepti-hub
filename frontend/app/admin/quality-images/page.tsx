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
          <h1 className="text-2xl font-bold text-gray-100">Quality Images</h1>
          <p className="text-gray-400 mt-1">Manage certificate of analysis and quality assurance images</p>
        </div>
        <Button onClick={handleAddImage} className="bg-brand-600 hover:bg-brand-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-dark-bg-card border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Images</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{totalImages}</p>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <ImageIcon className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-bg-card border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Images</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{activeImages}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-bg-card border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Inactive Images</p>
                <p className="text-2xl font-bold text-gray-100 mt-2">{inactiveImages}</p>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <EyeOff className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Images Grid */}
      <Card className="bg-dark-bg-card border-white/5">
        <CardHeader>
          <CardTitle className="text-gray-100">All Quality Images</CardTitle>
          <CardDescription className="text-gray-400">Certificate of analysis and quality assurance images displayed on the quality page</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-400">Loading quality images...</p>
            </div>
          ) : qualityImages.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No quality images found</p>
              <Button onClick={handleAddImage} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qualityImages.map((image, index) => (
                <Card key={image.id} className="overflow-hidden bg-dark-bg-card border-white/5 flex flex-col h-full border">
                  <div className="aspect-video bg-gray-900 relative border-b border-white/5">
                    <img
                      src={getFullImageUrl(image.imageUrl)}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'flex flex-col items-center justify-center text-gray-500 w-full h-full bg-white/5';
                          placeholder.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-2">No Image</span>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className={image.isActive ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-gray-500/20 text-gray-400 border-gray-500/20"}>
                        {image.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="bg-dark-bg-card/80 backdrop-blur-sm border-white/10 text-gray-300">
                        Order: {image.order}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-100 mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{image.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(image.id, "up")}
                          disabled={index === 0}
                          className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(image.id, "down")}
                          disabled={index === qualityImages.length - 1}
                          className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-dark-bg-card border-white/10 text-gray-100">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleEditImage(image)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(image.id)}
                            className="text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-bg-card border-white/10 text-gray-100 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editingImage ? "Edit Quality Image" : "Add New Quality Image"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingImage
                ? "Update the quality image information below."
                : "Fill in the details to add a new quality image."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Certificate of Analysis - Batch #12345"
                  required
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this certificate or test result"
                  rows={3}
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Image *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  className="w-full bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Image from Library
                </Button>

                {formData.imageUrl && (
                  <div className="mt-2">
                    <div className="aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10">
                      <img
                        src={getFullImageUrl(formData.imageUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-dark-bg-card px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Label htmlFor="imageUrl" className="text-gray-300">Enter image URL manually</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/certificate.jpg"
                  required
                  className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order" className="text-gray-300">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-gray-300">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-700"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer text-gray-300">
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
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSubmitting ? "Saving..." : editingImage ? "Update Image" : "Create Image"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Quality Image</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this quality image? This action cannot be undone.
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
