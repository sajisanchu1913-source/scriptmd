# Step 1 — Start with Node.js 18 for building React
FROM node:20-alpine

# Step 2 — Create /app folder inside container
WORKDIR /app

# Step 3 — Copy package.json first
# Docker caches this — won't reinstall if unchanged
COPY package*.json ./

# Step 4 — Install all React dependencies
# Same as npm install on your Mac
RUN npm install

# Step 5 — Copy all React source code
COPY . .

# Step 6 — Tell Docker this container uses port 5173
EXPOSE 5173

# Step 7 — Start Vite development server
# --host = makes it accessible from outside the container
# Without --host React would only be visible inside the container
CMD ["./node_modules/.bin/vite", "--host"]