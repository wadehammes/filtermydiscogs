#!/bin/bash
# Script to load .env.local and run prisma db push
# This ensures Prisma can read the environment variables

# Load variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Run prisma db push
npx prisma db push

