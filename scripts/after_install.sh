#!/bin/bash
# After install deployment script

echo "Running after_install.sh..."

# Install dependencies
npm ci --production

# Generate Prisma client
npm run db:generate

# Build the application
npm run build

echo "after_install.sh completed." 