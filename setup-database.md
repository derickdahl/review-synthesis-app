# Database Setup Instructions

## Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ccahoscpvmqvalsyxukw
2. Navigate to "SQL Editor" 
3. Copy the entire `supabase-schema.sql` file content
4. Paste and execute in the SQL Editor

## Option 2: Local CLI (when connection is stable)
```bash
export SUPABASE_ACCESS_TOKEN=$(cat ~/.clawdbot/credentials/supabase-token-personal)
cd ~/Documents/review-synthesis-app
supabase db push
```

## Database Schema Includes:
- Users/Managers table
- Employees table  
- Review cycles table
- Reviews table (main data)
- Review history (audit trail)
- Row Level Security policies
- File storage bucket setup
- Proper indexes and triggers

## Test the Setup:
Once schema is applied, the app at https://review-synthesis-app.vercel.app should be fully functional with:
- ✅ File uploads
- ✅ Database storage
- ✅ AI synthesis (using your Claude API key)
- ✅ Professional review generation