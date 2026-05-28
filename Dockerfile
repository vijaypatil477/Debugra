# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
