FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Ensure upload directory exists
RUN mkdir -p public/uploads

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
