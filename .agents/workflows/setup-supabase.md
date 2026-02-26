---
description: Sets up Vercel auto-migrations for Supabase by modifying package.json
---
# Supabase Auto-Migration Setup

This workflow configures a project to automatically push Supabase database migrations every time it is built on Vercel. 

**Steps for AntiGravity to execute:**
1. Use the `multi_replace_file_content` tool to read `package.json`.
2. Add the following line to the `"scripts"` section: `"prebuild": "npx supabase link --project-ref $SUPABASE_PROJECT_ID --password $SUPABASE_DB_PASSWORD && npx supabase db push --password $SUPABASE_DB_PASSWORD"`
3. If necessary, format the JSON correctly.
4. Send a message to the user reminding them that the setup is complete, and that they must add the following **three Environment Variables** to their Vercel Project Settings for it to work:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_ID`
