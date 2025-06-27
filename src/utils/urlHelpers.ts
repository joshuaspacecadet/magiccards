/**
 * Utility functions for handling URLs and links
 */

/**
 * Ensures a URL has a proper protocol (http/https)
 * @param url - The URL to normalize
 * @returns A properly formatted URL with protocol
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // If it already has a protocol, return as-is
  if (trimmedUrl.match(/^https?:\/\//i)) {
    return trimmedUrl;
  }
  
  // If it starts with www., add https://
  if (trimmedUrl.match(/^www\./i)) {
    return `https://${trimmedUrl}`;
  }
  
  // If it looks like a domain (contains a dot), add https://
  if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
    return `https://${trimmedUrl}`;
  }
  
  // Otherwise, return as-is (might be invalid, but let the browser handle it)
  return trimmedUrl;
};

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns True if the URL appears valid
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    new URL(normalizedUrl);
    return true;
  } catch {
    return false;
  }
};

/**
 * Opens a URL in a new tab/window safely
 * @param url - The URL to open
 */
export const openUrlSafely = (url: string): void => {
  if (!url) return;
  
  const normalizedUrl = normalizeUrl(url);
  if (isValidUrl(normalizedUrl)) {
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Downloads a file from a URL
 * @param url - The file URL
 * @param filename - The desired filename
 */
export const downloadFile = (url: string, filename: string): void => {
  if (!url) return;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};