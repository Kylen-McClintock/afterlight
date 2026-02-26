#!/bin/bash

echo "Running Supabase migrations..."

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "Error: SUPABASE_PROJECT_ID is not set in this environment."
  echo "Please check your Vercel Environment Variables and ensure they are checked for the 'Production' environment."
  # We exit 0 here so it doesn't break the build if the user hasn't set it yet, 
  # but warns them loudly in the logs. You can change to exit 1 if you want it to fail explicitly.
  exit 0
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "Error: SUPABASE_DB_PASSWORD is not set."
  exit 0
fi

echo "Linking to Supabase project $SUPABASE_PROJECT_ID..."
npx supabase link --project-ref "$SUPABASE_PROJECT_ID" --password "$SUPABASE_DB_PASSWORD"

echo "Pushing database migrations..."
npx supabase db push --password "$SUPABASE_DB_PASSWORD"

echo "Migrations completed successfully!"
