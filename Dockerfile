# Use Node.js Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the rest of the project
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port 5000
EXPOSE 5000

# Run the app
CMD ["node", "app.js"]
