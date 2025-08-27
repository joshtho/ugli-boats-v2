# Build script for Render deployment
# This will be run automatically by Render

echo "🚀 Starting Render build process..."

# Install dependencies for the main project (frontend)
echo "📦 Installing frontend dependencies..."
npm install

# Install dependencies for the server
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Copy the built frontend to server's public directory
echo "📂 Setting up static files..."
mkdir -p server/public
cp -r dist/* server/public/

echo "✅ Build complete! Ready for deployment."
