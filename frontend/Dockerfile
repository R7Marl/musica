FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS build
ARG NEXT_PUBLIC_API_URL=auto
ARG NEXT_PUBLIC_ROOT_DOMAIN=localhost
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
COPY . .
RUN npm run build

FROM dependencies AS development
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3001
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3001"]

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3001
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3001"]
