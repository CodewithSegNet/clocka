import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-17b9cebd`;

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param folder The folder path (e.g., 'assignee-photos', 'id-cards', 'student-photos')
 * @returns The public URL of the uploaded file
 */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  try {
    // Validate file type - Only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Invalid file type: ${file.type}. Only JPG, PNG, and WebP images are supported.`);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Convert file to base64 for transport
    const base64 = await fileToBase64(file);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${folder}/${timestamp}-${randomStr}.${extension}`;
    
    // Upload to server
    const response = await fetch(`${API_BASE}/storage/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        filename,
        fileData: base64,
        contentType: file.type
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [STORAGE] Upload failed:', error);
      throw new Error(error.message || error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('❌ [STORAGE] Upload error:', error);
    throw error; // Re-throw the original error with the message
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a file from Supabase Storage
 * @param url The URL of the file to delete
 */
export async function deleteFromStorage(url: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }
  } catch (error) {
    console.error('Delete error:', error);
    // Don't throw - deletion is not critical
  }
}