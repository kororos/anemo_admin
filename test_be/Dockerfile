# Dockerfile for test_be node application

# Use a base image
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

RUN chmod +x entrypoint.sh

RUN mkdir -p ./uploads

# Expose the application port
EXPOSE 3000

ENTRYPOINT [ "./entrypoint.sh" ]

# Define the command to run the application
CMD ["npm", "run-script", "prod"]
