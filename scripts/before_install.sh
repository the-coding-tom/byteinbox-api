#!/bin/bash
# Before install deployment script

echo "Running before_install.sh..."

# Stop any running application
pkill -f "node"

# Clean up previous installations
rm -rf node_modules
rm -rf dist

echo "before_install.sh completed." 