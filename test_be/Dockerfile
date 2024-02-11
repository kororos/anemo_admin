# Dockerfile for test_be node application

# Use a base image
FROM node:alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Expose the application port
EXPOSE 8000

# Define the command to run the application
CMD ["node", "index.js"]
