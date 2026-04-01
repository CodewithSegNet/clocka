import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Storage initialization flag to prevent race conditions
let storageInitialized = false;
let storageInitializing = false;

// Initialize Supabase Storage bucket on startup
async function initializeStorage() {
  if (storageInitialized || storageInitializing) {
    return;
  }
  
  storageInitializing = true;
  
  try {
    const bucketName = 'make-17b9cebd-school-assets';
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      storageInitializing = false;
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`);
      
      // Create public bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
      
      if (error) {
        // If error is "already exists", that's fine
        if (error.message?.includes('already exists')) {
          console.log(`✅ Storage bucket already exists: ${bucketName}`);
        } else {
          console.error('❌ Failed to create storage bucket:', error);
        }
      } else {
        console.log('✅ Storage bucket created successfully');
      }
    } else {
      console.log(`✅ Storage bucket already exists: ${bucketName}`);
    }
    
    storageInitialized = true;
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  } finally {
    storageInitializing = false;
  }
}

// Start initialization but don't block server startup
initializeStorage().catch(err => {
  console.error('❌ Storage initialization failed:', err);
});

// Helper function to safely parse JSON request body
async function safeParseJSON(c: any) {
  try {
    const text = await c.req.text();
    if (!text || text.trim() === '') {
      return { success: false, error: 'Request body is empty' };
    }
    return { success: true, data: JSON.parse(text) };
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return { success: false, error: 'Invalid JSON in request body' };
  }
}

// Enable logger
app.use('*', logger(console.log));

// Request timeout middleware - prevent hanging connections
app.use('*', async (c, next) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
  
  try {
    await next();
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      console.error('⏱️ [TIMEOUT] Request timed out:', c.req.path);
      return c.json({ 
        success: false, 
        error: 'Request timed out' 
      }, 504);
    }
    throw error;
  }
});

// Global error handler - MUST be before CORS
app.onError((err, c) => {
  console.error('❌ [GLOBAL ERROR HANDLER] Unhandled error:', err);
  console.error('❌ [GLOBAL ERROR HANDLER] Error stack:', err.stack);
  console.error('❌ [GLOBAL ERROR HANDLER] Request path:', c.req.path);
  console.error('❌ [GLOBAL ERROR HANDLER] Request method:', c.req.method);
  
  // Always return a JSON response
  return c.json({
    success: false,
    error: err.message || 'Internal server error',
    details: err.stack
  }, 500);
});

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type", 
      "Authorization", 
      "cache-control", 
      "x-requested-with",
      "pragma",
      "expires",
      "accept",
      "accept-language",
      "content-language"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
    credentials: true,
  }),
);

// Helper functions
function generateId(prefix: string): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp.slice(-6)}${random}`;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Health check endpoint
app.get("/make-server-17b9cebd/health", (c) => {
  return c.json({ status: "ok" });
});

// Storage health check endpoint
app.get("/make-server-17b9cebd/storage/health", async (c) => {
  try {
    const bucketName = 'make-17b9cebd-school-assets';
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return c.json({ 
        success: false, 
        error: 'Failed to list buckets',
        details: listError
      });
    }
    
    const targetBucket = buckets?.find(b => b.name === bucketName);
    
    return c.json({ 
      success: true,
      bucketExists: !!targetBucket,
      bucketName,
      bucket: targetBucket,
      allBuckets: buckets?.map(b => b.name) || []
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Get public configuration
app.get("/make-server-17b9cebd/config", (c) => {
  return c.json({ 
    projectId: Deno.env.get("SUPABASE_URL")?.match(/https:\/\/([^.]+)/)?.[1] || "twoumwgowoozpejqflub",
    publicAnonKey: Deno.env.get("SUPABASE_ANON_KEY") || ""
  });
});

// ==================== STORAGE UPLOAD ENDPOINT ====================

// Upload image to Supabase Storage (server-side to bypass RLS)
app.post("/make-server-17b9cebd/upload-image", async (c) => {
  try {
    console.log('📤 [UPLOAD] Receiving image upload request...');
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const schoolCode = formData.get('schoolCode') as string;
    
    if (!file) {
      console.error('❌ [UPLOAD] No file provided');
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    if (!schoolCode) {
      console.error('❌ [UPLOAD] No school code provided');
      return c.json({ success: false, error: 'School code is required' }, 400);
    }
    
    console.log('📤 [UPLOAD] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 5MB' }, 400);
    }
    
    // Strict file type validation - only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      console.error('❌ [UPLOAD] Invalid file type:', file.type);
      return c.json({ 
        success: false, 
        error: 'Invalid file type. Only JPG, PNG, and WebP images are supported.' 
      }, 415);
    }
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `background-${schoolCode}-${Date.now()}.${fileExt}`;
    const filePath = `school-backgrounds/${fileName}`;
    
    console.log('📤 [UPLOAD] Uploading to Storage:', filePath);
    
    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-17b9cebd-school-assets')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ [UPLOAD] Storage upload failed:', uploadError);
      return c.json({ 
        success: false, 
        error: uploadError.message || 'Upload failed' 
      }, 500);
    }
    
    console.log('✅ [UPLOAD] File uploaded successfully:', uploadData);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('make-17b9cebd-school-assets')
      .getPublicUrl(filePath);
    
    const imageUrl = urlData.publicUrl;
    console.log('✅ [UPLOAD] Public URL generated:', imageUrl);
    
    return c.json({ 
      success: true, 
      url: imageUrl,
      path: filePath
    });
  } catch (error) {
    console.error('❌ [UPLOAD] Unexpected error:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Upload base64 image to Supabase Storage
app.post("/make-server-17b9cebd/storage/upload", async (c) => {
  try {
    console.log('📤 [STORAGE] Receiving base64 upload request...');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { filename, fileData, contentType } = parseResult.data;
    
    if (!filename || !fileData) {
      return c.json({ success: false, error: 'Filename and fileData required' }, 400);
    }
    
    // Strict content type validation - only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const normalizedContentType = (contentType || 'image/jpeg').toLowerCase();
    if (!allowedTypes.includes(normalizedContentType)) {
      console.error('❌ [STORAGE] Invalid content type:', contentType);
      return c.json({ 
        success: false, 
        error: 'Invalid file type. Only JPG, PNG, and WebP images are supported.' 
      }, 415);
    }
    
    console.log('📤 [STORAGE] Uploading:', filename);
    
    // Convert base64 to Uint8Array
    const base64Data = fileData.split(',')[1]; // Remove data:image/...;base64, prefix
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-17b9cebd-school-assets')
      .upload(filename, bytes, {
        contentType: normalizedContentType,
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ [STORAGE] Upload failed:', uploadError);
      return c.json({ success: false, error: uploadError.message }, 500);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('make-17b9cebd-school-assets')
      .getPublicUrl(filename);
    
    console.log('✅ [STORAGE] Uploaded successfully:', urlData.publicUrl);
    
    return c.json({ 
      success: true, 
      url: urlData.publicUrl 
    });
  } catch (error) {
    console.error('❌ [STORAGE] Error:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Delete file from Supabase Storage
app.delete("/make-server-17b9cebd/storage/delete", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { url } = parseResult.data;
    
    if (!url) {
      return c.json({ success: false, error: 'URL required' }, 400);
    }
    
    // Extract path from URL
    const urlParts = url.split('/make-17b9cebd-school-assets/');
    if (urlParts.length < 2) {
      return c.json({ success: false, error: 'Invalid URL format' }, 400);
    }
    
    const filePath = urlParts[1];
    
    // Delete from storage
    const { error } = await supabase.storage
      .from('make-17b9cebd-school-assets')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ [STORAGE] Delete failed:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [STORAGE] Delete error:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== MIGRATION HELPER ====================

// Migrate localStorage data to Supabase
app.post("/make-server-17b9cebd/migrate", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, students, parents, attendanceLogs } = parseResult.data;
    
    console.log('Starting migration for school:', schoolCode);
    console.log('Students to migrate:', students?.length);
    console.log('Parents to migrate:', parents?.length);
    console.log('Logs to migrate:', attendanceLogs?.length);
    
    let migratedCount = { students: 0, parents: 0, families: 0, logs: 0 };
    
    // Migrate students first
    if (students && students.length > 0) {
      for (const student of students) {
        await kv.set(`student:${student.id}`, {
          ...student,
          schoolCode,
          createdAt: new Date().toISOString()
        });
        migratedCount.students++;
      }
    }
    
    // Group parents by familyId and migrate
    const familyMap = new Map();
    if (parents && parents.length > 0) {
      for (const parent of parents) {
        // Ensure parent has a familyId
        const familyId = parent.familyId || generateId('FID');
        
        if (!familyMap.has(familyId)) {
          familyMap.set(familyId, {
            id: familyId,
            schoolCode,
            parentIds: [],
            studentIds: new Set(),
            createdAt: new Date().toISOString()
          });
        }
        
        const family = familyMap.get(familyId);
        family.parentIds.push(parent.id);
        
        // Add this parent's children to family
        (parent.childrenIds || []).forEach(cid => family.studentIds.add(cid));
        
        // Save parent with familyId
        await kv.set(`parent:${parent.id}`, {
          ...parent,
          familyId,
          schoolCode,
          createdAt: parent.createdAt || new Date().toISOString()
        });
        migratedCount.parents++;
      }
    }
    
    // Save all families
    for (const [familyId, family] of familyMap) {
      family.studentIds = Array.from(family.studentIds);
      await kv.set(`family:${familyId}`, family);
      migratedCount.families++;
    }
    
    // Migrate attendance logs
    if (attendanceLogs && attendanceLogs.length > 0) {
      for (const log of attendanceLogs) {
        const logId = log.id || generateId('LOG');
        
        // Convert timestamp to ISO string if it's a Date object
        const timestamp = log.timestamp instanceof Date 
          ? log.timestamp.toISOString() 
          : typeof log.timestamp === 'string'
          ? log.timestamp
          : new Date().toISOString();
        
        await kv.set(`attendance:${logId}`, {
          id: logId,
          parentId: log.parentId,
          parentName: log.parentName,
          studentId: log.childrenIds?.[0] || '', // First child in the log
          type: log.type,
          timestamp,
          createdAt: new Date().toISOString()
        });
        migratedCount.logs++;
      }
    }
    
    console.log('Migration completed:', migratedCount);
    
    return c.json({ 
      success: true, 
      migrated: migratedCount
    });
  } catch (error) {
    console.error('Error during migration:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Test endpoint to check KV store
app.get("/make-server-17b9cebd/test", async (c) => {
  try {
    await kv.set('test:key', { message: 'Hello from Supabase!' });
    const value = await kv.get('test:key');
    return c.json({ success: true, test: value });
  } catch (error) {
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== SCHOOL ROUTES ====================

// Get school info by school code (PUBLIC - for parent login pages)
app.get("/make-server-17b9cebd/schools/:schoolCode", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching school info for:', schoolCode);
    
    // Validate school code
    if (!schoolCode || schoolCode.trim().length === 0) {
      return c.json({ success: false, error: 'Invalid school code' }, 400);
    }
    
    // Add timeout to prevent hanging connections
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('KV store timeout')), 8000)
    );
    
    const schoolDataPromise = kv.get(`school:${schoolCode}`);
    
    let schoolData;
    try {
      schoolData = await Promise.race([schoolDataPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.error('❌ KV store timeout for school:', schoolCode);
      return c.json({ 
        success: false, 
        error: 'Request timeout - please try again' 
      }, 504);
    }
    
    if (!schoolData) {
      console.log('⚠️ School not found:', schoolCode);
      return c.json({ success: false, error: 'School not found' }, 404);
    }
    
    console.log('✅ School found:', schoolData.name || schoolData.id);
    
    return c.json({ 
      success: true, 
      school: schoolData 
    });
  } catch (error) {
    console.error('❌ Error fetching school:', error);
    
    // Ensure we always return a JSON response
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ 
      success: false, 
      error: errorMessage || 'Internal server error' 
    }, 500);
  }
});

// Create or update school
app.post("/make-server-17b9cebd/schools", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, name, address, email, phone, logo, status, parentPortalAppearance } = parseResult.data;
    
    if (!schoolCode || !name) {
      return c.json({ success: false, error: 'School code and name are required' }, 400);
    }
    
    // Check if school already exists
    const existingSchool = await kv.get(`school:${schoolCode}`);
    
    const schoolData = {
      id: schoolCode,
      schoolCode,
      name,
      address: address || '',
      email: email || '',
      phone: phone || '',
      logo: logo || '',
      status: status || 'active',
      parentPortalAppearance: parentPortalAppearance || {
        backgroundType: 'gradient',
        backgroundImage: '',
        backgroundColor: '#10b981',
        gradientFrom: '#10b981',
        gradientTo: '#14b8a6'
      },
      createdAt: existingSchool?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`school:${schoolCode}`, schoolData);
    
    console.log('✅ School saved:', schoolCode);
    console.log('🎨 Background settings saved:', schoolData.parentPortalAppearance);
    
    return c.json({ 
      success: true, 
      school: schoolData 
    });
  } catch (error) {
    console.error('Error saving school:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Get all schools (for super admin)
app.get("/make-server-17b9cebd/schools", async (c) => {
  try {
    console.log('📡 Fetching all schools from Supabase KV store');
    
    // Get all schools from KV store with timeout protection
    let schools;
    try {
      schools = await Promise.race([
        kv.getByPrefix('school:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout - too many records')), 10000)
        )
      ]) as any[];
    } catch (timeoutError: any) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      // Return empty array instead of failing completely
      return c.json({ 
        success: true, 
        schools: [],
        warning: 'Database query timed out - too many records. Please use localStorage cache.'
      });
    }
    
    console.log('✅ Loaded', schools?.length || 0, 'schools from Supabase');
    
    return c.json({ 
      success: true, 
      schools: schools || [] 
    });
  } catch (error: any) {
    console.error('❌ Error fetching schools:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// ==================== PARENT ROUTES ====================

// Get all parents for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/parents", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching parents for school:', schoolCode);
    
    // Get all parents from KV store with timeout
    let allParents;
    try {
      allParents = await Promise.race([
        kv.getByPrefix('parent:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - database query took too long' 
      }, 504);
    }
    
    // Filter by school code
    const schoolParents = allParents.filter((p: any) => p.schoolCode === schoolCode);
    
    console.log('✅ Loaded', schoolParents.length, 'parents from Supabase for school:', schoolCode);
    
    return c.json({ 
      success: true, 
      parents: schoolParents || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching parents:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Create parent
app.post("/make-server-17b9cebd/parents", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, ...parentData } = parseResult.data;
    
    if (!schoolCode) {
      return c.json({ success: false, error: 'School code is required' }, 400);
    }
    
    const parent = {
      ...parentData,
      schoolCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating parent:', parent.id, 'for school:', schoolCode);
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`parent:${parent.id}`, parent),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save parent: ${kvError.message}` }, 500);
    }
    
    return c.json({ 
      success: true, 
      parent 
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Update parent
app.put("/make-server-17b9cebd/parents/:id", async (c) => {
  try {
    const id = c.req.param('id');
    console.log('👤 Updating parent:', id);
    
    let updates;
    try {
      updates = await c.req.json();
      console.log('📦 Parent updates received:', updates);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return c.json({ success: false, error: 'Invalid JSON in request body' }, 400);
    }
    
    // Get existing parent with timeout
    console.log('🔍 Fetching existing parent from KV store...');
    let existingParent;
    try {
      existingParent = await Promise.race([
        kv.get(`parent:${id}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV get timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV get failed:', kvError);
      return c.json({ success: false, error: `Failed to fetch parent: ${kvError.message}` }, 500);
    }
    
    if (!existingParent) {
      console.warn('⚠️ Parent not found:', id);
      return c.json({ success: false, error: 'Parent not found' }, 404);
    }
    
    // Merge updates
    const updatedParent = {
      ...existingParent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Saving updated parent to KV store...');
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`parent:${id}`, updatedParent),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save parent: ${kvError.message}` }, 500);
    }
    
    console.log('✅ Parent updated successfully');
    
    return c.json({ 
      success: true, 
      parent: updatedParent 
    });
  } catch (error) {
    console.error('❌ Unexpected error updating parent:', error);
    return c.json({ success: false, error: String(error?.message || error) }, 500);
  }
});

// Delete parent
app.delete("/make-server-17b9cebd/parents/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('Deleting parent:', id);
    
    const parent = await kv.get(`parent:${id}`);
    
    if (!parent) {
      return c.json({ success: true, message: 'Parent not found or already deleted' });
    }
    
    await kv.del(`parent:${id}`);
    
    console.log('Parent deleted successfully');
    
    return c.json({ 
      success: true, 
      message: 'Parent deleted',
      deletedParent: parent
    });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Get parent by credentials (for login)
app.post("/make-server-17b9cebd/parents/login", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, parentId, pin } = parseResult.data;
    
    if (!schoolCode || !parentId || !pin) {
      return c.json({ success: false, error: 'School code, parent ID, and PIN are required' }, 400);
    }
    
    console.log('Login attempt for parent:', parentId, 'in school:', schoolCode);
    
    // Get all parents for this school
    const allParents = await kv.getByPrefix('parent:');
    const parent = allParents.find((p: any) => 
      p.schoolCode === schoolCode && 
      p.parentId === parentId && 
      p.pin === pin
    );
    
    if (!parent) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    console.log('Login successful for parent:', parent.name);
    
    return c.json({ 
      success: true, 
      parent 
    });
  } catch (error) {
    console.error('Error during parent login:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== ATTENDANCE LOG ROUTES ====================

// Get all attendance logs for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/attendance-logs", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching attendance logs for school:', schoolCode);
    
    // Get all attendance logs from KV store with timeout
    let allLogs;
    try {
      allLogs = await Promise.race([
        kv.getByPrefix('attendance:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - database query took too long' 
      }, 504);
    }
    
    // Filter by school code
    const schoolLogs = allLogs.filter((log: any) => log.schoolCode === schoolCode);
    
    console.log('✅ Loaded', schoolLogs.length, 'attendance logs from Supabase for school:', schoolCode);
    
    return c.json({ 
      success: true, 
      logs: schoolLogs || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching attendance logs:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Create attendance log
app.post("/make-server-17b9cebd/attendance-logs", async (c) => {
  try {
    console.log('📝 [ATTENDANCE LOG] Receiving attendance log creation request...');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { id, schoolCode, parentId, parentName, parentPhoto, childrenIds, childrenNames, type, timestamp, assigneeId, assigneeName, assigneePhoto, assignedBy, assignedByName, assignedByPhoto, faceImage } = parseResult.data;
    
    if (!schoolCode || !parentId || !type) {
      console.error('❌ [ATTENDANCE LOG] Missing required fields');
      return c.json({ success: false, error: 'School code, parent ID, and type are required' }, 400);
    }
    
    // Use the ID from the client if provided, otherwise generate a new one
    const logId = id || generateId('LOG');
    const logTimestamp = timestamp || new Date().toISOString();
    const log = {
      id: logId,
      schoolCode,
      parentId,
      parentName,
      parentPhoto: parentPhoto || undefined,
      childrenIds,
      childrenNames,
      type,
      timestamp: logTimestamp,
      // Assignee fields
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName || undefined,
      assigneePhoto: assigneePhoto || undefined,
      assignedBy: assignedBy || undefined,
      assignedByName: assignedByName || undefined,
      assignedByPhoto: assignedByPhoto || undefined,
      // Facial verification
      faceImage: faceImage || undefined,
      createdAt: new Date().toISOString()
    };
    
    console.log('📝 [ATTENDANCE LOG] Creating attendance log:', logId, 'for parent:', parentId, '(client-provided ID:', !!id, ')', faceImage ? '✅ With face verification' : '⚠️ No face verification');
    
    // Store in KV store for fast retrieval with timeout
    try {
      await Promise.race([
        kv.set(`attendance:${logId}`, log),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout for attendance log')), 5000)
        )
      ]);
      console.log('✅ [ATTENDANCE LOG] Saved to KV store');
    } catch (kvError) {
      console.error('❌ [ATTENDANCE LOG] KV store save failed:', kvError);
      return c.json({ 
        success: false, 
        error: `Failed to save attendance log: ${kvError.message}` 
      }, 500);
    }
    
    // Also insert into attendance_logs table for real-time subscriptions (non-blocking)
    try {
      const { error } = await supabase
        .from('attendance_logs')
        .insert({
          id: logId,
          school_code: schoolCode,
          parent_id: parentId,
          parent_name: parentName,
          parent_photo: parentPhoto || null,
          children_ids: childrenIds,
          children_names: childrenNames,
          type,
          timestamp: logTimestamp,
          // Assignee fields for real-time sync
          assignee_id: assigneeId || null,
          assignee_name: assigneeName || null,
          assignee_photo: assigneePhoto || null,
          assigned_by: assignedBy || null,
          assigned_by_name: assignedByName || null,
          assigned_by_photo: assignedByPhoto || null,
          // Facial verification
          face_image: faceImage || null,
          created_at: log.createdAt
        });
      
      if (error) {
        console.warn('⚠️ [ATTENDANCE LOG] Failed to insert into attendance_logs table (real-time will not work):', error);
      } else {
        console.log('✅ [ATTENDANCE LOG] Attendance log saved to both KV store and attendance_logs table');
      }
    } catch (dbError) {
      console.warn('⚠️ [ATTENDANCE LOG] Failed to save to attendance_logs table:', dbError);
      // Continue even if DB insert fails - KV store is primary
    }
    
    return c.json({ 
      success: true, 
      log 
    });
  } catch (error) {
    console.error('❌ [ATTENDANCE LOG] Unexpected error creating attendance log:', error);
    return c.json({ success: false, error: String(error?.message || error) }, 500);
  }
});

// ==================== CHILD ADDITION REQUEST ROUTES ====================

// Get all child addition requests for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/child-requests", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching child addition requests for school:', schoolCode);
    
    // Get all child requests from KV store with timeout
    let allRequests;
    try {
      allRequests = await Promise.race([
        kv.getByPrefix('childrequest:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - database query took too long' 
      }, 504);
    }
    
    // Filter by school code
    const schoolRequests = allRequests.filter((req: any) => req.schoolCode === schoolCode);
    
    console.log('✅ Loaded', schoolRequests.length, 'child addition requests from Supabase for school:', schoolCode);
    
    return c.json({ 
      success: true, 
      requests: schoolRequests || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching child addition requests:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Create child addition request
app.post("/make-server-17b9cebd/child-requests", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, ...requestData } = parseResult.data;
    
    if (!schoolCode) {
      return c.json({ success: false, error: 'School code is required' }, 400);
    }
    
    // Use the ID provided by frontend if available, otherwise generate one
    const requestId = requestData.id || generateId('REQ');
    const request = {
      ...requestData,
      id: requestId,
      schoolCode,
      requestDate: requestData.requestDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating child addition request:', requestId);
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`childrequest:${requestId}`, request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save request: ${kvError.message}` }, 500);
    }
    
    return c.json({ 
      success: true, 
      request 
    });
  } catch (error) {
    console.error('Error creating child addition request:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Update child addition request
app.put("/make-server-17b9cebd/child-requests/:id", async (c) => {
  try {
    const id = c.req.param('id');
    console.log('📝 Updating child addition request:', id);
    
    let updates;
    try {
      updates = await c.req.json();
      console.log('📦 Updates received:', updates);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return c.json({ success: false, error: 'Invalid JSON in request body' }, 400);
    }
    
    // Get existing request with timeout
    console.log('🔍 Fetching existing request from KV store...');
    let existingRequest;
    try {
      existingRequest = await Promise.race([
        kv.get(`childrequest:${id}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV get timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV get failed:', kvError);
      return c.json({ success: false, error: `Failed to fetch request: ${kvError.message}` }, 500);
    }
    
    if (!existingRequest) {
      console.warn('⚠️ Request not found:', id);
      return c.json({ success: false, error: 'Request not found' }, 404);
    }
    
    // Merge updates
    const updatedRequest = {
      ...existingRequest,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Saving updated request to KV store...');
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`childrequest:${id}`, updatedRequest),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save request: ${kvError.message}` }, 500);
    }
    
    console.log('✅ Request updated successfully');
    
    return c.json({ 
      success: true, 
      request: updatedRequest 
    });
  } catch (error) {
    console.error('❌ Unexpected error updating child addition request:', error);
    return c.json({ success: false, error: String(error?.message || error) }, 500);
  }
});

// Delete child addition request
app.delete("/make-server-17b9cebd/child-requests/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('🗑️ [SERVER DELETE] Starting delete for request ID:', id);
    console.log('🔍 [SERVER DELETE] Looking for key:', `childrequest:${id}`);
    
    // Get request with timeout
    let request;
    try {
      request = await Promise.race([
        kv.get(`childrequest:${id}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV get timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV get failed:', kvError);
      return c.json({ success: false, error: `Failed to fetch request: ${kvError.message}` }, 500);
    }
    
    console.log('📋 [SERVER DELETE] Found request in DB?', request ? 'YES' : 'NO');
    if (request) {
      console.log('📄 [SERVER DELETE] Request data:', request);
    }
    
    if (!request) {
      console.log('⚠️ [SERVER DELETE] Request not found, returning success (already deleted)');
      return c.json({ success: true, message: 'Request not found or already deleted' });
    }
    
    console.log('🔥 [SERVER DELETE] Calling kv.del...');
    
    // Delete with timeout
    try {
      await Promise.race([
        kv.del(`childrequest:${id}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV del timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV del failed:', kvError);
      return c.json({ success: false, error: `Failed to delete request: ${kvError.message}` }, 500);
    }
    
    console.log('✅ [SERVER DELETE] kv.del completed successfully');
    
    // Verify deletion
    const verifyDeleted = await kv.get(`childrequest:${id}`);
    console.log('🔍 [SERVER DELETE] Verification - still in DB?', verifyDeleted ? 'YES (DELETE FAILED!)' : 'NO (SUCCESS)');
    
    return c.json({ 
      success: true, 
      message: 'Request deleted',
      deletedRequest: request,
      verified: !verifyDeleted
    });
  } catch (error) {
    console.error('❌ [SERVER DELETE] Error deleting child addition request:', error);
    console.error('❌ [SERVER DELETE] Error stack:', error.stack);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== ASSIGNEE ROUTES ====================

// Get all assignees for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/assignees", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching assignees for school:', schoolCode);
    
    // Get all assignees from KV store with timeout
    let allAssignees;
    try {
      allAssignees = await Promise.race([
        kv.getByPrefix('assignee:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - database query took too long' 
      }, 504);
    }
    
    // Filter out access code indices (they start with "assignee:access:")
    // Only keep actual assignee records (they have a fullName property)
    const actualAssignees = allAssignees.filter((item: any) => 
      item && typeof item === 'object' && item.fullName
    );
    
    // Filter by school code and check expiry
    const now = new Date();
    const schoolAssignees = actualAssignees
      .filter((assignee: any) => assignee.schoolCode === schoolCode)
      .map((assignee: any) => {
        // Auto-deactivate expired assignees
        const expiresAt = new Date(assignee.expiresAt);
        if (expiresAt < now && assignee.isActive) {
          assignee.isActive = false;
          // Update in background
          kv.set(`assignee:${assignee.id}`, assignee).catch(console.error);
        }
        return assignee;
      });
    
    console.log('✅ Loaded', schoolAssignees.length, 'assignees from Supabase for school:', schoolCode);
    
    return c.json({ 
      success: true, 
      assignees: schoolAssignees || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching assignees:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Create assignee
app.post("/make-server-17b9cebd/assignees", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, ...assigneeData } = parseResult.data;
    
    if (!schoolCode) {
      return c.json({ success: false, error: 'School code is required' }, 400);
    }
    
    // Use the ID provided by frontend if available, otherwise generate one
    const assigneeId = assigneeData.id || generateId('ASG');
    
    // Use access code from frontend if provided, otherwise generate one
    const accessCode = assigneeData.accessCode || `ASG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    console.log('🔑 [SERVER] Access code from frontend:', assigneeData.accessCode);
    console.log('🔑 [SERVER] Final access code to use:', accessCode);
    
    const assignee = {
      ...assigneeData,
      id: assigneeId,
      schoolCode,
      accessCode, // This now uses the frontend-provided code
      createdAt: assigneeData.createdAt || new Date().toISOString(),
      expiresAt: assigneeData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
      isActive: true
    };
    
    console.log('✅ [SERVER] Creating assignee:', assigneeId, 'with access code:', assignee.accessCode, 'for family:', assignee.familyId);
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`assignee:${assigneeId}`, assignee),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
      
      // Also create an index by access code for quick lookup
      await Promise.race([
        kv.set(`assignee:access:${accessCode}`, assigneeId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save assignee: ${kvError.message}` }, 500);
    }
    
    console.log('✅ [SERVER] Assignee saved with access code:', assignee.accessCode);
    
    // Also insert into assignees table for real-time subscriptions (non-blocking)
    try {
      const { error } = await supabase
        .from('assignees')
        .insert({
          id: assigneeId,
          school_code: schoolCode,
          parent_id: assignee.parentId,
          parent_name: assignee.parentName,
          parent_email: assignee.parentEmail || null,
          parent_phone: assignee.parentPhone || null,
          parent_photo: assignee.parentPhoto || null,
          family_id: assignee.familyId,
          children_ids: assignee.childrenIds,
          full_name: assignee.fullName,
          photo: assignee.photo,
          phone_number: assignee.phoneNumber,
          id_type: assignee.idType,
          id_number: assignee.idNumber,
          id_photo: assignee.idPhoto,
          created_at: assignee.createdAt,
          expires_at: assignee.expiresAt,
          is_active: assignee.isActive,
          access_code: assignee.accessCode
        });
      
      if (error) {
        console.warn('⚠️ [ASSIGNEE] Failed to insert into assignees table (real-time will not work):', error);
      } else {
        console.log('✅ [ASSIGNEE] Assignee saved to both KV store and assignees table');
      }
    } catch (dbError) {
      console.warn('⚠️ [ASSIGNEE] Failed to save to assignees table:', dbError);
      // Continue even if DB insert fails - KV store is primary
    }
    
    return c.json({ 
      success: true, 
      assignee 
    });
  } catch (error) {
    console.error('Error creating assignee:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Update assignee
app.put("/make-server-17b9cebd/assignees/:id", async (c) => {
  try {
    const id = c.req.param('id');
    console.log('📝 Updating assignee:', id);
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const updates = parseResult.data;
    
    // Get existing assignee
    const existingAssignee = await kv.get(`assignee:${id}`);
    
    if (!existingAssignee) {
      return c.json({ success: false, error: 'Assignee not found' }, 404);
    }
    
    const updatedAssignee = {
      ...existingAssignee,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`assignee:${id}`, updatedAssignee);
    
    console.log('✅ Assignee updated successfully');
    
    // Also update in assignees table for real-time subscriptions (non-blocking)
    try {
      const { error } = await supabase
        .from('assignees')
        .update({
          parent_id: updatedAssignee.parentId,
          parent_name: updatedAssignee.parentName,
          parent_email: updatedAssignee.parentEmail || null,
          parent_phone: updatedAssignee.parentPhone || null,
          parent_photo: updatedAssignee.parentPhoto || null,
          family_id: updatedAssignee.familyId,
          children_ids: updatedAssignee.childrenIds,
          full_name: updatedAssignee.fullName,
          photo: updatedAssignee.photo,
          phone_number: updatedAssignee.phoneNumber,
          id_type: updatedAssignee.idType,
          id_number: updatedAssignee.idNumber,
          id_photo: updatedAssignee.idPhoto,
          expires_at: updatedAssignee.expiresAt,
          is_active: updatedAssignee.isActive,
          updated_at: updatedAssignee.updatedAt
        })
        .eq('id', id);
      
      if (error) {
        console.warn('⚠️ [ASSIGNEE] Failed to update assignees table (real-time may not work):', error);
      } else {
        console.log('✅ [ASSIGNEE] Assignee updated in both KV store and assignees table');
      }
    } catch (dbError) {
      console.warn('⚠️ [ASSIGNEE] Failed to update assignees table:', dbError);
      // Continue even if DB update fails - KV store is primary
    }
    
    return c.json({ 
      success: true, 
      assignee: updatedAssignee 
    });
  } catch (error) {
    console.error('❌ Error updating assignee:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Delete assignee
app.delete("/make-server-17b9cebd/assignees/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('🗑️ Deleting assignee:', id);
    
    const assignee = await kv.get(`assignee:${id}`);
    
    if (!assignee) {
      return c.json({ success: true, message: 'Assignee not found or already deleted' });
    }
    
    // Delete assignee record
    await kv.del(`assignee:${id}`);
    
    // Delete access code index
    if (assignee.accessCode) {
      await kv.del(`assignee:access:${assignee.accessCode}`);
    }
    
    console.log('✅ Assignee deleted successfully');
    
    return c.json({ 
      success: true, 
      message: 'Assignee deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting assignee:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Get assignee by access code (for login)
app.get("/make-server-17b9cebd/assignees/access/:accessCode", async (c) => {
  try {
    const accessCode = c.req.param('accessCode');
    console.log('🔍 Looking up assignee by access code:', accessCode);
    
    // Get assignee ID from access code index
    const assigneeId = await kv.get(`assignee:access:${accessCode}`);
    
    if (!assigneeId) {
      return c.json({ success: false, error: 'Invalid access code' }, 404);
    }
    
    // Get assignee record
    const assignee = await kv.get(`assignee:${assigneeId}`);
    
    if (!assignee) {
      return c.json({ success: false, error: 'Assignee not found' }, 404);
    }
    
    // Check if expired
    const expiresAt = new Date(assignee.expiresAt);
    const now = new Date();
    
    if (expiresAt < now) {
      // Mark as inactive
      assignee.isActive = false;
      await kv.set(`assignee:${assigneeId}`, assignee);
      return c.json({ success: false, error: 'Access code has expired' }, 403);
    }
    
    if (!assignee.isActive) {
      return c.json({ success: false, error: 'Access has been revoked' }, 403);
    }
    
    console.log('✅ Assignee found and active:', assignee.fullName);
    
    return c.json({ 
      success: true, 
      assignee 
    });
  } catch (error) {
    console.error('❌ Error fetching assignee by access code:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== STUDENT ROUTES ====================

// Create student
app.post("/make-server-17b9cebd/students", async (c) => {
  try {
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { schoolCode, ...studentData } = parseResult.data;
    
    if (!schoolCode) {
      return c.json({ success: false, error: 'School code is required' }, 400);
    }
    
    const student = {
      ...studentData,
      schoolCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating student:', student.id, 'for school:', schoolCode);
    
    // Save with timeout
    try {
      await Promise.race([
        kv.set(`student:${student.id}`, student),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save student: ${kvError.message}` }, 500);
    }
    
    return c.json({ 
      success: true, 
      student 
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Get all students for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/students", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching students for school:', schoolCode);
    
    // Get all students from KV store with timeout
    let allStudents;
    try {
      allStudents = await Promise.race([
        kv.getByPrefix('student:'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout - too many records')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - too many students in database. Please contact support.' 
      }, 504);
    }
    
    // Filter by school code
    const schoolStudents = allStudents.filter((s: any) => s.schoolCode === schoolCode);
    
    console.log('✅ Loaded', schoolStudents.length, 'students from Supabase for school:', schoolCode);
    
    return c.json({ 
      success: true, 
      students: schoolStudents || [] 
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    return c.json({ 
      success: false, 
      error: String(error.message || error) 
    }, 500);
  }
});

// Update student
app.put("/make-server-17b9cebd/students/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const updates = parseResult.data;
    
    console.log('Updating student:', id);
    
    // Get existing student
    const existingStudent = await kv.get(`student:${id}`);
    
    if (!existingStudent) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }
    
    // Merge updates
    const updatedStudent = {
      ...existingStudent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`student:${id}`, updatedStudent);
    
    console.log('Student updated successfully');
    
    return c.json({ 
      success: true, 
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Delete student
app.delete("/make-server-17b9cebd/students/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('🗑️ HARD DELETE student:', id);
    
    // Get student before deleting to verify it exists
    const student = await kv.get(`student:${id}`);
    
    if (!student) {
      console.log('⚠️ Student not found, may already be deleted');
      return c.json({ success: true, message: 'Student not found or already deleted' });
    }
    
    // PERMANENTLY DELETE from KV store
    await kv.del(`student:${id}`);
    
    console.log('✅ Student PERMANENTLY deleted from Supabase');
    
    return c.json({ 
      success: true, 
      message: 'Student permanently deleted',
      deletedStudent: student
    });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== CLASSES ROUTES ====================

// Get classes for a school
app.get("/make-server-17b9cebd/schools/:schoolCode/classes", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('📡 Fetching classes for school:', schoolCode);
    
    const classes = await kv.get(`classes:${schoolCode}`);
    
    if (!classes) {
      console.log('ℹ️ No classes found for school:', schoolCode);
      return c.json({ 
        success: true, 
        classes: {
          selectedClasses: [],
          customClasses: []
        }
      });
    }
    
    console.log('✅ Loaded classes for school:', schoolCode);
    return c.json({ 
      success: true, 
      classes 
    });
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Save classes for a school
app.post("/make-server-17b9cebd/schools/:schoolCode/classes", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const { selectedClasses, customClasses } = parseResult.data;
    
    console.log('💾 Saving classes for school:', schoolCode);
    
    const classes = {
      selectedClasses: selectedClasses || [],
      customClasses: customClasses || [],
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`classes:${schoolCode}`, classes);
    
    console.log('✅ Classes saved successfully');
    return c.json({ 
      success: true, 
      classes 
    });
  } catch (error) {
    console.error('❌ Error saving classes:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// ==================== SECURITY PERSONNEL ROUTES ====================

// Get all security personnel for a school
// Get all security personnel for a school
app.get("/make-server-17b9cebd/security/:schoolCode", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    console.log('🔒 Fetching security personnel for school:', schoolCode);

    // Get with timeout
    let allPersonnel;
    try {
      allPersonnel = await Promise.race([
        kv.getByPrefix(`security:${schoolCode}:`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV getByPrefix timeout')), 8000)
        )
      ]);
    } catch (timeoutError) {
      console.error('❌ KV getByPrefix timeout:', timeoutError);
      return c.json({ 
        success: false, 
        error: 'Request timeout - database query took too long' 
      }, 504);
    }
    
    const personnel = allPersonnel.map(p => typeof p === 'string' ? JSON.parse(p) : p);

    console.log(`✅ Found ${personnel.length} security personnel`);
    return c.json({ success: true, personnel });
  } catch (error) {
    console.error('❌ Error fetching security personnel:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Create security personnel
app.post("/make-server-17b9cebd/security/:schoolCode", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const personnelData = parseResult.data;
    
    console.log('🔒 Creating security personnel for school:', schoolCode);

    // Save to KV store with timeout
    try {
      await Promise.race([
        kv.set(`security:${schoolCode}:${personnelData.id}`, JSON.stringify(personnelData)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to save security personnel: ${kvError.message}` }, 500);
    }

    console.log('✅ Security personnel created:', personnelData.fullName);
    return c.json({ success: true, personnel: personnelData });
  } catch (error) {
    console.error('❌ Error creating security personnel:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Update security personnel
app.put("/make-server-17b9cebd/security/:schoolCode/:personnelId", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    const personnelId = c.req.param('personnelId');
    
    const parseResult = await safeParseJSON(c);
    if (!parseResult.success) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    
    const updates = parseResult.data;
    
    console.log('🔒 Updating security personnel:', personnelId);

    // Get existing personnel with timeout
    let existingData;
    try {
      existingData = await Promise.race([
        kv.get(`security:${schoolCode}:${personnelId}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV get timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV get failed:', kvError);
      return c.json({ success: false, error: `Failed to fetch security personnel: ${kvError.message}` }, 500);
    }
    
    if (!existingData) {
      return c.json({ success: false, error: 'Security personnel not found' }, 404);
    }

    const existing = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
    const updated = { ...existing, ...updates };

    // Save back with timeout
    try {
      await Promise.race([
        kv.set(`security:${schoolCode}:${personnelId}`, JSON.stringify(updated)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KV set timeout')), 5000)
        )
      ]);
    } catch (kvError) {
      console.error('❌ KV set failed:', kvError);
      return c.json({ success: false, error: `Failed to update security personnel: ${kvError.message}` }, 500);
    }

    console.log('✅ Security personnel updated');
    return c.json({ success: true, personnel: updated });
  } catch (error) {
    console.error('❌ Error updating security personnel:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Delete security personnel
app.delete("/make-server-17b9cebd/security/:schoolCode/:personnelId", async (c) => {
  try {
    const schoolCode = c.req.param('schoolCode');
    const personnelId = c.req.param('personnelId');
    
    console.log('🔒 Deleting security personnel:', personnelId);

    await kv.del(`security:${schoolCode}:${personnelId}`);

    console.log('✅ Security personnel deleted');
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting security personnel:', error);
    return c.json({ success: false, error: String(error.message || error) }, 500);
  }
});

// Catch-all 404 handler - MUST be last route
app.notFound((c) => {
  console.log('⚠️ [404] Route not found:', c.req.url);
  return c.json({ 
    success: false, 
    error: 'Route not found',
    path: c.req.path 
  }, 404);
});

Deno.serve(app.fetch);