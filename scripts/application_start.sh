#!/bin/bash
# Application start script for deployment

echo "Starting application..."

# Run database migrations
npm run db:migrate

# Start the application
npm run start:prod 