# 🚀 Clocka - Supabase Setup Guide

## ✅ What's Already Done

Your frontend is now configured to connect to your new Supabase instance:
- **Project ID**: `tfckmsqustixddizmtet`
- **URL**: `https://tfckmsqustixddizmtet.supabase.co`
- **Frontend Configuration**: Updated in `/utils/supabase/info.tsx`

---

## 📋 Required Setup Steps

### Step 1: Create the Database Table

1. Go to your Supabase dashboard SQL Editor:
   ```
   https://supabase.com/dashboard/project/tfckmsqustixddizmtet/editor
   ```

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New Query"**

4. Copy and paste this SQL code:

```sql
-- Create the KV store table for Clocka
CREATE TABLE IF NOT EXISTS kv_store_17b9cebd (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster prefix queries
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_17b9cebd (key text_pattern_ops);

-- Enable Row Level Security
ALTER TABLE kv_store_17b9cebd ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access"
ON kv_store_17b9cebd
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policy to allow anon key read access
CREATE POLICY "Allow anon read access"
ON kv_store_17b9cebd
FOR SELECT
USING (true);
```

5. Click **"Run"** or press `Ctrl+Enter`

6. You should see: ✅ **"Success. No rows returned"**

---

### Step 2: Deploy the Edge Function

Your Edge Function code is in `/supabase/functions/server/index.tsx`. You need to deploy it to your Supabase project.

#### Option A: Deploy via Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref tfckmsqustixddizmtet
   ```

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy make-server-17b9cebd
   ```

#### Option B: Deploy via Supabase Dashboard

1. Go to Edge Functions:
   ```
   https://supabase.com/dashboard/project/tfckmsqustixddizmtet/functions
   ```

2. Click **"Create Function"**

3. Name it: `make-server-17b9cebd`

4. Copy the entire contents of `/supabase/functions/server/index.tsx` into the editor

5. Click **"Deploy Function"**

---

### Step 3: Set Environment Variables

The Edge Function needs three environment variables:

1. Go to Edge Functions Settings:
   ```
   https://supabase.com/dashboard/project/tfckmsqustixddizmtet/functions
   ```

2. Click on **"Manage secrets"** or **"Settings"**

3. Add these three secrets:

   **Secret Name**: `SUPABASE_URL`  
   **Secret Value**: `https://tfckmsqustixddizmtet.supabase.co`

   **Secret Name**: `SUPABASE_ANON_KEY`  
   **Secret Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY2ttc3F1c3RpeGRkaXptdGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQwMDYsImV4cCI6MjA4NjI5MDAwNn0.Qeo8cxVNBy9YVYphGyfQw_2AlFDAuINxH19AruCvgj8`

   **Secret Name**: `SUPABASE_SERVICE_ROLE_KEY`  
   **Secret Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY2ttc3F1c3RpeGRkaXptdGV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcxNDAwNiwiZXhwIjoyMDg2MjkwMDA2fQ.CibzlXnntFd7iSifHBlNNruTM7vzDGpbAQlAsWRbPzM`

4. **Important**: After adding secrets, you may need to **redeploy** your Edge Function for the changes to take effect.

---

### Step 4: Test the Connection

1. **Test the Health Endpoint**:
   
   Open this URL in your browser:
   ```
   https://tfckmsqustixddizmtet.supabase.co/functions/v1/make-server-17b9cebd/health
   ```

   You should see:
   ```json
   {"status":"ok"}
   ```

2. **Test from the App**:
   
   - Open your Clocka app
   - Check the browser console
   - You should see successful connection messages instead of "Failed to fetch" errors

---

## 🎯 Current Status

### ✅ Completed
- [x] Frontend configuration updated
- [x] New Supabase credentials configured
- [x] Project ID updated to `tfckmsqustixddizmtet`

### ⏳ Pending (You Need to Do)
- [ ] Create database table (SQL in Step 1)
- [ ] Deploy Edge Function (Step 2)
- [ ] Set environment variables (Step 3)
- [ ] Test the connection (Step 4)

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch" errors

**Cause**: Edge Function not deployed or environment variables not set.

**Solution**: 
1. Complete Step 2 (Deploy Edge Function)
2. Complete Step 3 (Set environment variables)
3. Redeploy the function after setting variables

### Issue: "Table does not exist" errors

**Cause**: Database table not created.

**Solution**: Run the SQL from Step 1 in your Supabase SQL Editor.

### Issue: "CORS" errors

**Cause**: Edge Function not deployed correctly.

**Solution**: The Edge Function code already includes proper CORS headers. Redeploy the function.

### Issue: "Authorization" errors

**Cause**: Environment variables not set or incorrect.

**Solution**: Double-check the three environment variables in Step 3 match exactly.

---

## 📦 Offline Mode

Your app is designed to work offline! If the backend is unavailable:

- ✅ App continues to work using localStorage
- ✅ You'll see an "Offline Mode" indicator
- ✅ All data is saved locally
- ✅ Once backend is connected, you can sync data

---

## 🚀 Ready to Deploy?

Once you complete all 4 steps above:

1. Your Clocka app will connect to Supabase
2. Data will sync automatically
3. Multi-school features will work
4. Image uploads will work
5. All admin features will be enabled

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Ensure the database table was created successfully

---

## 🎉 Next Steps After Setup

After successful setup:
1. Create your first school via Super Admin portal
2. Add students and parents
3. Test the parent portal with a school code
4. Set up custom branding for each school

Good luck! 🚀
