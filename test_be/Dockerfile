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

RUN mkdir -p ./uploads

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "run-script", "dev"]
