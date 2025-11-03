#!/bin/bash

# Sophia AI - Production Deployment Script
# This script deploys the Supabase Edge Function and prepares the frontend for production

set -e  # Exit on error

echo "🚀 Sophia AI Production Deployment"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're logged in
echo "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Supabase authentication verified"
echo ""

# Get project reference
read -p "Enter your Supabase project reference ID: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference is required"
    exit 1
fi

echo ""
echo "Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "✅ Project linked successfully"
echo ""

# Deploy edge function
echo "Deploying Edge Function: chat-ai..."
cd /workspace/sophia-ai-production
supabase functions deploy chat-ai --project-ref "$PROJECT_REF"

echo ""
echo "✅ Edge Function deployed"
echo ""

# Set OpenAI API key
read -sp "Enter your OpenAI API key: " OPENAI_KEY
echo ""

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ OpenAI API key is required"
    exit 1
fi

echo ""
echo "Setting OpenAI API key as Supabase secret..."
echo "$OPENAI_KEY" | supabase secrets set OPENAI_API_KEY --project-ref "$PROJECT_REF"

echo ""
echo "✅ Secret configured"
echo ""

# Get Supabase URL
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
EDGE_FUNCTION_URL="${SUPABASE_URL}/functions/v1/chat-ai"

echo "=================================="
echo "✅ Backend Deployment Complete!"
echo "=================================="
echo ""
echo "Edge Function URL: $EDGE_FUNCTION_URL"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update .env file:"
echo "   VITE_MODE=production"
echo "   VITE_EDGE_FUNCTION_URL=$EDGE_FUNCTION_URL"
echo "   # Remove or comment out VITE_OPENAI_API_KEY"
echo ""
echo "2. Update src/App.tsx:"
echo "   Change import from './openaiService' to './openaiService-backend'"
echo ""
echo "3. Build for production:"
echo "   pnpm run build"
echo ""
echo "4. Deploy dist/ folder to your hosting provider"
echo ""
echo "=================================="
