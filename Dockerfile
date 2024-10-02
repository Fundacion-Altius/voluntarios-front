# Use an official Node runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install  

# The project code will be mounted as a volume, so we don't need to copy it here

# Expose the port the app runs on
EXPOSE 3000

# The command will be overridden by docker-compose for development
CMD ["npm", "start"]