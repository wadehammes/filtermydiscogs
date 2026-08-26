#!/bin/bash
export $(grep -v '^#' .env.local | xargs)
npx prisma db update
