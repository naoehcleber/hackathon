# Dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM deps AS build
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instala só runtime
COPY package*.json ./
RUN npm ci --omit=dev

# Copia artefatos de build
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# se você tiver next.config.*, copie também:
COPY --from=build /app/next.config.* ./

EXPOSE 3000
CMD ["npm", "start", "--", "-p", "3000"]
