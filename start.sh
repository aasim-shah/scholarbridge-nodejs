#!/bin/bash

# Production startup script for ScholarHub API

echo "🚀 Starting ScholarHub API Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with required variables."
    exit 1
fi

# Check if MongoDB is accessible
echo "📊 Checking MongoDB connection..."
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  Warning: mongosh not found. Skipping MongoDB check."
else
    MONGODB_URI=$(grep MONGODB_URI .env | cut -d '=' -f2)
    if [ -n "$MONGODB_URI" ]; then
        echo "✅ MongoDB URI found in .env"
    else
        echo "❌ Error: MONGODB_URI not set in .env"
        exit 1
    fi
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=" .env; then
    echo "❌ Error: OPENAI_API_KEY not set in .env"
    exit 1
fi

echo "✅ Environment checks passed"

# Build the project
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

# Start the server
echo "🎯 Starting server..."
NODE_ENV=production npm start
