# Step 1 — Start with Node.js 18 on a lightweight Linux system
# "alpine" = a tiny version of Linux — makes the container small and fast
FROM node:18-alpine

# Step 2 — Create a folder inside the container called /app
# All our code will live here
WORKDIR /app

# Step 3 — Copy package.json first
# We do this BEFORE copying all the code
# Why? Docker caches this step — if package.json hasn't changed
# it won't re-run npm install every time. Saves time.
COPY package*.json ./

# Step 4 — Install all dependencies
# Same as running npm install on your Mac
RUN npm install

# Step 5 — Copy ALL the rest of the code into the container
COPY . .

# Step 6 — Tell Docker this container uses port 3000
EXPOSE 3000

# Step 7 — The command that starts the server
# Same as typing "node index.js" in your terminal
CMD ["node", "index.js"]