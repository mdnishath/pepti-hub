"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { mediaAPI, Media } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");

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
    loadMedia();
  }, []);

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
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mpeg', '.webm', '.mov'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await mediaAPI.delete(deleteId);
      toast.success("Media deleted successfully");
      setMedia(media.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error("Failed to delete media", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get API base URL - ensure no trailing slash
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Media Library</h1>
        <p className="text-gray-400 mt-2">
          Upload and manage your images and videos
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="bg-dark-bg-card border-white/5">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive
              ? "border-brand-500 bg-brand-500/10"
              : "border-white/10 hover:border-brand-400/50 hover:bg-white/5"
              } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-100">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium text-brand-400">
                    Drop files here...
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-100 mb-1">
                      Drag and drop files here
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      or click to select files
                    </p>
                    <Button type="button" variant="outline" className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                      Select Files
                    </Button>
                    <p className="text-xs text-gray-500 mt-4">
                      Supports images and videos up to 10MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
            All ({media.length})
          </TabsTrigger>
          <TabsTrigger value="IMAGE" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
            Images ({media.filter((m) => m.type === "IMAGE").length})
          </TabsTrigger>
          <TabsTrigger value="VIDEO" className="data-[state=active]:bg-brand-600 data-[state=active]:text-white text-gray-400">
            Videos ({media.filter((m) => m.type === "VIDEO").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                {filter === "VIDEO" ? (
                  <Video className="w-10 h-10 text-gray-500" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-500" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-100 mb-1">
                No {filter === "ALL" ? "media" : filter.toLowerCase() + "s"} found
              </h3>
              <p className="text-gray-400">
                Upload some files to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredMedia.map((item) => (
                <Card key={item.id} className="group relative overflow-hidden bg-dark-bg-card border-white/5">
                  <CardContent className="p-0">
                    {/* Media Preview */}
                    <div className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden relative">
                      {item.type === "IMAGE" ? (
                        <img
                          src={`${API_BASE_URL}${item.url.startsWith('/') ? item.url : '/' + item.url}`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const fullUrl = `${API_BASE_URL}${item.url.startsWith('/') ? item.url : '/' + item.url}`;
                            console.error("Failed to load image:", fullUrl);
                            // Show placeholder icon instead
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const placeholder = document.createElement('div');
                              placeholder.className = 'flex flex-col items-center justify-center text-gray-500 w-full h-full';
                              placeholder.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-2">Image error</span>';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Video className="w-12 h-12 mb-2" />
                          <span className="text-xs">Video</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-2 border-t border-white/5">
                      <p className="text-xs text-gray-300 truncate" title={item.originalName}>
                        {item.originalName}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 hover:bg-white/20">
                          {item.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">Delete Media</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this media file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
