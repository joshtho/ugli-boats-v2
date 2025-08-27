#!/bin/bash

# Bulk URL Replacement Script for Production Deployment
# This script replaces all hardcoded localhost URLs with proper production-ready code

echo "🔄 Starting bulk URL replacement for production deployment..."

# Define the source directory
SRC_DIR="src"

# Backup function (optional but recommended)
echo "📋 Creating backup of src folder..."
cp -r "$SRC_DIR" "${SRC_DIR}_backup_$(date +%Y%m%d_%H%M%S)"

echo "🔍 Scanning for hardcoded localhost URLs..."

# Find all files with hardcoded URLs
echo "Files with hardcoded URLs:"
grep -r "localhost:3001" "$SRC_DIR" --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq

echo ""
echo "🛠️  Starting replacements..."

# 1. Replace simple fetch calls to API endpoints
echo "Replacing fetch('http://localhost:3001/api/...')"
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s|fetch('http://localhost:3001/api/\([^']*\)'|fetch(getApiUrl('\1')|g"

# 2. Replace fetch calls with backticks for dynamic URLs
echo "Replacing fetch(\`http://localhost:3001/api/...\`)"
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s|fetch(\`http://localhost:3001/api/\([^\`]*\)\`|fetch(getApiUrl(\`\1\`))|g"

# 3. Replace image URL constructions
echo "Replacing image URL constructions"
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s|\`http://localhost:3001\${[^}]*}\`|getImageUrl(&)|g"

# 4. Replace simple localhost image references
echo "Replacing simple localhost image references"
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s|http://localhost:3001/uploads/|getImageUrl('|g"
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s|http://localhost:3001/ugli-boats-v2|getImageUrl('/ugli-boats-v2|g"

# 5. Add missing imports where needed
echo "Adding missing imports..."

# Function to add imports if not already present
add_import_if_missing() {
    local file="$1"
    local import_line="$2"
    
    # Check if import already exists
    if ! grep -q "getApiUrl\|getImageUrl" "$file" 2>/dev/null; then
        # Check if file has any imports from @/config/api
        if ! grep -q "from '@/config/api'" "$file" 2>/dev/null; then
            # Find the last import line and add our import after it
            if grep -q "^import" "$file"; then
                # Add import after the last existing import
                sed -i.bak "/^import.*from.*$/a\\
$import_line" "$file"
            fi
        fi
    fi
}

# Add imports to files that need them
for file in $(find "$SRC_DIR" -name "*.ts" -o -name "*.tsx"); do
    if grep -q "getApiUrl\|getImageUrl" "$file" 2>/dev/null; then
        add_import_if_missing "$file" "import { getApiUrl, getImageUrl } from '@/config/api'"
    fi
done

# 6. Clean up backup files
echo "🧹 Cleaning up temporary files..."
find "$SRC_DIR" -name "*.bak" -delete

echo ""
echo "✅ Bulk replacement completed!"
echo ""
echo "📊 Summary of changes:"
echo "Files that still need manual review:"
grep -r "localhost" "$SRC_DIR" --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq | while read file; do
    echo "  - $file"
done

echo ""
echo "🔍 Manual steps still needed:"
echo "1. Review files listed above for any remaining localhost references"
echo "2. Add 'import { getApiUrl, getImageUrl } from \"@/config/api\"' to files that need it"
echo "3. Test the application locally to ensure all URLs work"
echo ""
echo "💡 To restore from backup if needed: rm -rf $SRC_DIR && mv ${SRC_DIR}_backup_* $SRC_DIR"
