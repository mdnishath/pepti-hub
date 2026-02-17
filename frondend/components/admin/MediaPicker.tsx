"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { mediaAPI, Media } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Video, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media | Media[]) => void;
  multiple?: boolean;
  type?: "IMAGE" | "VIDEO" | "ALL";
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  type = "ALL",
}: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">(type);

  // Load media
  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaAPI.getAll();
      setMedia(data);
      filterMedia(data, filter);
    } catch (error: any) {
      toast.error("Failed to load media", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMedia();
      setSelectedIds(new Set());
    }
  }, [open]);

  // Filter media
  const filterMedia = (data: Media[], filterType: "ALL" | "IMAGE" | "VIDEO") => {
    if (filterType === "ALL") {
      setFilteredMedia(data);
    } else {
      setFilteredMedia(data.filter((m) => m.type === filterType));
    }
  };

  useEffect(() => {
    filterMedia(media, filter);
  }, [filter, media]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      setUploading(true);

      if (acceptedFiles.length === 1) {
        await mediaAPI.upload(acceptedFiles[0]);
        toast.success("File uploaded successfully");
      } else {
        await mediaAPI.uploadMultiple(acceptedFiles);
        toast.success(`${acceptedFiles.length} files uploaded successfully`);
      }

      await loadMedia();
    } catch (error: any) {
      toast.error("Failed to upload file(s)", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setUploading(false);
    }
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': type === "VIDEO" ? [] : ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': type === "IMAGE" ? [] : ['.mp4', '.mpeg', '.webm', '.mov'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  // Handle selection
  const handleSelect = (item: Media) => {
    if (multiple) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(new Set([item.id]));
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    const selected = media.filter((m) => selectedIds.has(m.id));
    if (selected.length === 0) {
      toast.error("Please select at least one media item");
      return;
    }

    onSelect(multiple ? selected : selected[0]);
    onOpenChange(false);
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Select {multiple ? "Media" : "a Media File"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-gray-400" />
                {isDragActive ? (
                  <p className="text-sm font-medium text-blue-600">
                    Drop files here...
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Drop files here or click to upload
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="ALL">
                All ({media.length})
              </TabsTrigger>
              <TabsTrigger value="IMAGE">
                Images ({media.filter((m) => m.type === "IMAGE").length})
              </TabsTrigger>
              <TabsTrigger value="VIDEO">
                Videos ({media.filter((m) => m.type === "VIDEO").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {filter === "VIDEO" ? (
                      <Video className="w-8 h-8 text-gray-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    No {filter === "ALL" ? "media" : filter.toLowerCase() + "s"} found
                  </h3>
                  <p className="text-sm text-gray-500">
                    Upload some files to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMedia.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer transition-all overflow-hidden",
                        selectedIds.has(item.id)
                          ? "ring-2 ring-blue-500"
                          : "hover:ring-2 hover:ring-gray-300"
                      )}
                      onClick={() => handleSelect(item)}
                    >
                      <CardContent className="p-0 relative">
                        {/* Selection Indicator */}
                        {selectedIds.has(item.id) && (
                          <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Media Preview */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                          {item.type === "IMAGE" ? (
                            <img
                              src={`${API_BASE_URL}${item.url}`}
                              alt={item.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <Video className="w-8 h-8 mb-1" />
                              <span className="text-xs">Video</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2 border-t">
                          <p className="text-xs text-gray-600 truncate" title={item.originalName}>
                            {item.originalName}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className="text-xs py-0 px-1">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatSize(item.size)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Select {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
