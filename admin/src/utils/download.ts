import api from '../services/api';

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadFromApi(endpoint: string, filename: string, mimeType?: string) {
  const response = await api.get(endpoint, { responseType: 'blob' });
  const blob = mimeType ? new Blob([response.data], { type: mimeType }) : response.data;
  triggerBrowserDownload(blob, filename);
}

export async function downloadPublicFile(fileUrl: string, filename: string) {
  const response = await fetch(fileUrl, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
}

