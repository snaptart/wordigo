#!/bin/bash
# Export local database to SQL file

# Set your local database credentials
LOCAL_DB_URL="postgresql://postgres:password@localhost:5432/wordigo"

# Output file
OUTPUT_FILE="wordigo-backup-$(date +%Y%m%d-%H%M%S).sql"

echo "Exporting database to $OUTPUT_FILE..."

# Export using pg_dump
pg_dump "$LOCAL_DB_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > "$OUTPUT_FILE"

echo "✓ Database exported successfully!"
echo "File: $OUTPUT_FILE"
echo ""
echo "To import to Render:"
echo "psql \$RENDER_DATABASE_URL < $OUTPUT_FILE"
