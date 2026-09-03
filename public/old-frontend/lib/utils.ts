import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an image URL for the application.
 * Supports absolute URLs (Google images etc.) and relative paths (appends base URL).
 */
export function getAppImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const baseUrl = 'https://onspot-api-frontend-61nmav-f95e2f-194-163-134-149.traefik.me';
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${path}`;
}

/**
 * Formats a resource file URL for the application.
 * Supports absolute URLs and relative paths (appends base URL).
 */
export function getResourceFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const baseUrl = 'https://onspot-api-frontend-61nmav-f95e2f-194-163-134-149.traefik.me';
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${path}`;
}
