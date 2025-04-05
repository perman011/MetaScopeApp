#!/bin/bash

# Create a directory for zip files if it doesn't exist
mkdir -p ./downloads

# Get current date and time for the zip filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ZIP_FILENAME="metascope_${TIMESTAMP}.zip"

# Zip all relevant project files, excluding node_modules, .git, etc.
zip -r "./downloads/${ZIP_FILENAME}" \
    ./client ./server ./shared ./mobile \
    package.json package-lock.json tsconfig.json \
    vite.config.ts tailwind.config.ts postcss.config.js \
    drizzle.config.ts \
    -x "*/node_modules/*" -x "*/dist/*" -x "*/.git/*" -x "*.DS_Store"

echo "Project zipped successfully to ./downloads/${ZIP_FILENAME}"
echo "You can download this file from the file explorer"
