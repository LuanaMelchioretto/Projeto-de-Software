FROM node:24-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# A migration must finish before the API accepts traffic.
CMD ["sh", "-c", "npm run db:deploy && npm start"]
