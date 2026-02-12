FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

ENV PORT=4000
EXPOSE 4000

# Start the Express server
CMD ["node", "server.js"]

