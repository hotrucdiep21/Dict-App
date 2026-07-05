FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to cache layers
COPY package.json package-lock.json* ./

RUN npm install

# Copy application source
COPY . .

EXPOSE 5173

# Run Vite dev server with host flag to expose it outside the container
CMD ["npm", "run", "dev", "--", "--host"]
