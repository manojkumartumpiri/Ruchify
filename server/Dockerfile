FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm install
COPY server server
EXPOSE 4000
CMD ["sh", "-c", "npx prisma generate --schema=server/prisma/schema.prisma && npx prisma migrate deploy --schema=server/prisma/schema.prisma && npm run db:seed --workspace server && npm run start --workspace server"]
