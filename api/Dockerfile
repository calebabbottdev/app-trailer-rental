# Use official Node LTS image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Install TypeScript globally to ensure it's executable
RUN npm install -g typescript

# Copy the rest of the app
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port Cloud Run will use
EXPOSE 8080

# Start the app
CMD [ "npm", "start" ]
