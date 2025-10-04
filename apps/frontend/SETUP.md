# Setup Guide

## 1. Database Setup

### Run the SQL Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `job_searches` table
- `job_results` table
- Row Level Security (RLS) policies
- Indexes for performance
- Helper views

### Verify Tables

After running the SQL, go to **Database** → **Tables** to verify:
- ✅ `job_searches` table exists
- ✅ `job_results` table exists
- ✅ `job_searches_with_stats` view exists

---

## 2. GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: Job Searcher (or your app name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
     - Find your project ref in Supabase dashboard URL
     - Example: `https://bxjcmicmgyhossnjhutm.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **GitHub** in the list
4. Enable the GitHub provider
5. Paste your **Client ID**
6. Paste your **Client Secret**
7. Click **Save**

### Step 3: Update Redirect URLs (Optional - for production)

In **Authentication** → **URL Configuration**:
- Add your production domain to **Site URL**
- Add callback URLs to **Redirect URLs**

---

## 3. Environment Variables

Make sure your `.env` file has:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR-ANON-KEY]

# Site URL for OAuth callbacks
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, update `NEXT_PUBLIC_SITE_URL` to your actual domain.

---

## 4. Testing the Setup

### Test Database

1. Sign up with email/password or GitHub
2. Complete a job search at `/search`
3. Go to Supabase dashboard → **Database** → **Table Editor**
4. Check `job_searches` table - you should see your search
5. Check `job_results` table - you should see the job results

### Test GitHub OAuth

1. Go to `/login`
2. Click **Continue with GitHub**
3. Authorize the app on GitHub
4. You should be redirected to `/dashboard`
5. Verify you're logged in

### Test Dashboard

1. Go to `/dashboard`
2. You should see your previous searches
3. Click on a search to view results
4. Test delete functionality

---

## 5. Production Deployment

When deploying to production (Vercel, etc.):

1. **Update GitHub OAuth App**:
   - Add production callback URL: `https://[YOUR-SUPABASE-REF].supabase.co/auth/v1/callback`
   - Add production homepage URL: `https://yourdomain.com`

2. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

3. **Update Supabase**:
   - Authentication → URL Configuration
   - Add production domain to Site URL
   - Add production callback to Redirect URLs

---

## 6. Troubleshooting

### GitHub OAuth not working
- ✅ Check callback URL matches exactly in GitHub and Supabase
- ✅ Verify Client ID and Secret are correct
- ✅ Check browser console for errors
- ✅ Ensure Site URL is set correctly

### Database permission errors
- ✅ Verify RLS policies are enabled
- ✅ Check that user is authenticated
- ✅ Verify `user_id` matches `auth.uid()`

### Jobs not saving
- ✅ Check browser console for errors
- ✅ Verify user is authenticated before search
- ✅ Check Supabase logs in dashboard

---

## Features Implemented

✅ User authentication (email/password + GitHub OAuth)
✅ Job search with AI analysis
✅ Save search results to user's account
✅ Dashboard to view past searches
✅ Click search to view detailed results
✅ Delete searches
✅ Row Level Security (users only see their own data)
✅ Responsive design with dark mode

---

## Next Steps

Optional enhancements:
- Add search filters (date range, min score, etc.)
- Export results to CSV/PDF
- Email notifications for new matching jobs
- Share search results via link
- Add notes/tags to saved jobs
- Schedule automated searches
