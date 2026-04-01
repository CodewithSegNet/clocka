// Test storage connection
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export async function testStorageConnection() {
  try {
    console.log('🧪 [STORAGE TEST] Testing storage connection...');
    
    // Test 1: Check server health
    const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17b9cebd/storage/health`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    
    const healthData = await healthResponse.json();
    console.log('🧪 [STORAGE TEST] Server health check:', healthData);
    
    if (!healthData.bucketExists) {
      console.error('❌ [STORAGE TEST] Bucket does not exist!');
      return { success: false, error: 'Bucket not found', details: healthData };
    }
    
    console.log('✅ [STORAGE TEST] Storage bucket exists and is accessible');
    return { success: true, data: healthData };
  } catch (error: any) {
    console.error('❌ [STORAGE TEST] Storage test failed:', error);
    return { success: false, error: error.message };
  }
}
