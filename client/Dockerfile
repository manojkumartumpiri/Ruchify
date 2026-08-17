FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm install
COPY client client
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace", "client", "--", "--host", "0.0.0.0"]
