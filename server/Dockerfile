FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV PORT=3001
EXPOSE 3001

# se seu arquivo principal for index.js, mantenha:
CMD ["node", "index.js"]
# se for server.js, troque o CMD acima.