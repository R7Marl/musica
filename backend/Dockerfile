FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM dependencies AS development
WORKDIR /app
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run start:dev"]

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/database/typeorm.data-source.js && node dist/main.js"]
