# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install && chown -R node:node /app

# Copy application files
COPY --chown=node:node . .

# Expose Vite development server port
EXPOSE 5173

# Switch to non-root user
USER node

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
