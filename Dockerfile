# Step 1: Use an official Node.js image as the base image
FROM node:20-alpine

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Step 4: Install the dependencies
RUN npm install

# Step 5: Copy all files from the current directory to the container's working directory
COPY . .

# Step 6: Build the Next.js application
RUN npm run build

# Step 7: Expose the port the app will run on
EXPOSE 3000

# Step 8: Start the Next.js app
CMD ["npm", "run", "start"]
