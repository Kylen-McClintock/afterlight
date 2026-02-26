---
description: Sets up Vercel auto-migrations for Supabase by modifying package.json
---
# Supabase Auto-Migration Setup

This workflow configures a project to automatically push Supabase database migrations every time it is built on Vercel. 

**Steps for AntiGravity to execute:**
1. Use the `write_to_file` tool to create `scripts/push-migrations.sh` with the following content:
```bash
#!/bin/bash
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  exit 0
fi
npx supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD"
npx supabase db push --password "$SUPABASE_DB_PASSWORD"
```
2. Run `chmod +x scripts/push-migrations.sh`
3. Use `multi_replace_file_content` to add the following line to the `"scripts"` section of `package.json`: `"prebuild": "bash scripts/push-migrations.sh"`
4. Send a message to the user reminding them that the setup is complete, and that they must add the following **three Environment Variables** to their Vercel Project Settings for it to work:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_ID`
