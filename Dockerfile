# Use official Node.js LTS image with Python support
FROM node:20-bullseye

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Create uploads directory for API file uploads
RUN mkdir -p /app/uploads

# Set uploads directory permissions (if needed)
RUN chmod 777 /app/uploads

# Install Python dependencies for embedding
RUN pip3 install --no-cache-dir sentence-transformers torch

# Build Next.js app
RUN npm run build

# Expose default Next.js port
EXPOSE 3000

# Set environment variables (override with your own .env in production)
ENV NODE_ENV=production

# Start Next.js server
CMD ["npm", "start"]