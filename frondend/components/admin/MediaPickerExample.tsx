/**
 * MediaPicker Usage Example
 *
 * This file demonstrates how to use the MediaPicker component
 * in your pages (e.g., Products, Categories)
 */

"use client";

import { useState } from "react";
import { MediaPicker } from "./MediaPicker";
import { Media } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function MediaPickerExample() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Media[]>([]);

  // Example 1: Single Image Selection
  const handleSingleSelect = (media: Media | Media[]) => {
    if (!Array.isArray(media)) {
      setSelectedMedia(media);
      console.log("Selected media:", media);
      // Use media.url for displaying: `${API_BASE_URL}${media.url}`
    }
  };

  // Example 2: Multiple Images Selection
  const handleMultipleSelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) {
      setSelectedMultiple(media);
      console.log("Selected media:", media);
      // Use media.map(m => m.url) to get all URLs
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div className="space-y-6">
      {/* Example 1: Single Image Picker */}
      <div>
        <h3 className="text-lg font-medium mb-2">Single Image Selection</h3>
        <Button onClick={() => setPickerOpen(true)}>
          Select Image
        </Button>
        {selectedMedia && (
          <div className="mt-4">
            <img
              src={`${API_BASE_URL}${selectedMedia.url}`}
              alt={selectedMedia.originalName}
              className="w-48 h-48 object-cover rounded"
            />
          </div>
        )}
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleSingleSelect}
          multiple={false}
          type="IMAGE" // or "VIDEO" or "ALL"
        />
      </div>

      {/* Example 2: Multiple Images Picker */}
      <div>
        <h3 className="text-lg font-medium mb-2">Multiple Images Selection</h3>
        <Button onClick={() => setPickerOpen(true)}>
          Select Images
        </Button>
        {selectedMultiple.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {selectedMultiple.map((media) => (
              <img
                key={media.id}
                src={`${API_BASE_URL}${media.url}`}
                alt={media.originalName}
                className="w-full h-32 object-cover rounded"
              />
            ))}
          </div>
        )}
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleMultipleSelect}
          multiple={true}
          type="IMAGE"
        />
      </div>
    </div>
  );
}

/**
 * Integration with Product Form Example:
 *
 * const [formData, setFormData] = useState({
 *   name: "",
 *   thumbnail: "",
 *   images: []
 * });
 *
 * const handleThumbnailSelect = (media: Media | Media[]) => {
 *   if (!Array.isArray(media)) {
 *     setFormData(prev => ({ ...prev, thumbnail: media.url }));
 *   }
 * };
 *
 * const handleImagesSelect = (media: Media | Media[]) => {
 *   if (Array.isArray(media)) {
 *     setFormData(prev => ({
 *       ...prev,
 *       images: media.map(m => m.url)
 *     }));
 *   }
 * };
 */
