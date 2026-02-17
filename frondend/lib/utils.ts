import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper function to convert relative image URLs to full URLs
 * @param url - The image URL (can be relative like /uploads/... or full URL)
 * @returns Full image URL
 */
export function getFullImageUrl(url: string | null | undefined): string {
  if (!url) return "";

  // If URL already starts with http/https, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If URL starts with /, prepend backend URL
  if (url.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // Remove /api from base URL if present
    const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
    return `${cleanBaseUrl}${url}`;
  }

  return url;
}
