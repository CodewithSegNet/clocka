/**
 * Compress image to reduce localStorage usage
 * Converts large images to smaller, optimized versions
 */

export const compressImage = async (
  file: File | string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      // Create canvas and draw compressed image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw image with white background (for transparent images)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      console.log('🗜️ Image compressed:');
      console.log('  - Original size:', typeof file === 'string' ? file.length : file.size, 'bytes');
      console.log('  - Compressed size:', compressedDataUrl.length, 'bytes');
      console.log('  - Savings:', Math.round((1 - compressedDataUrl.length / (typeof file === 'string' ? file.length : file.size)) * 100), '%');
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load image from File or data URL
    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Check localStorage usage
 */
export const getStorageInfo = () => {
  let totalSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    }
  }
  
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  const limitMB = 5; // Typical localStorage limit
  const usagePercent = Math.round((totalSize / (limitMB * 1024 * 1024)) * 100);
  
  return {
    totalSize,
    totalSizeMB,
    limitMB,
    usagePercent,
    isNearLimit: usagePercent > 80,
    isFull: usagePercent > 95
  };
};

/**
 * Get storage breakdown by key
 */
export const getStorageBreakdown = () => {
  const breakdown: { key: string; sizeMB: string; percent: number }[] = [];
  let totalSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      const size = key.length + value.length;
      totalSize += size;
    }
  }
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      const size = key.length + value.length;
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      const percent = Math.round((size / totalSize) * 100);
      
      breakdown.push({ key, sizeMB, percent });
    }
  }
  
  return breakdown.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));
};

/**
 * Clean up old attendance logs to free space
 */
export const cleanupOldLogs = (daysToKeep: number = 30) => {
  try {
    const logs = JSON.parse(localStorage.getItem('attendanceLogs') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredLogs = logs.filter((log: any) => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });
    
    const removed = logs.length - filteredLogs.length;
    
    if (removed > 0) {
      localStorage.setItem('attendanceLogs', JSON.stringify(filteredLogs));
      console.log(`🧹 Cleaned up ${removed} old attendance logs`);
    }
    
    return removed;
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return 0;
  }
};
