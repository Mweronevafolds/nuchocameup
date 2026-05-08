#!/usr/bin/env bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Paystack Edge Functions Deployment${NC}\n"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it from: https://github.com/supabase/cli#install-the-cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}\n"

# Deploy functions
echo -e "${YELLOW}Deploying Edge Functions...${NC}\n"

echo "1. Deploying paystack-initialize..."
supabase functions deploy paystack-initialize --project-ref urmjaogeibqombfjscla

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ paystack-initialize deployed${NC}\n"
else
    echo -e "${RED}✗ Failed to deploy paystack-initialize${NC}\n"
fi

echo "2. Deploying paystack-webhook..."
supabase functions deploy paystack-webhook --project-ref urmjaogeibqombfjscla

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ paystack-webhook deployed${NC}\n"
else
    echo -e "${RED}✗ Failed to deploy paystack-webhook${NC}\n"
fi

# Check deployment
echo -e "${YELLOW}Checking deployed functions...${NC}\n"
supabase functions list --project-ref urmjaogeibqombfjscla

echo -e "\n${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Next: Set up secrets in Supabase Dashboard${NC}"
