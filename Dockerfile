FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY ./server/package.json ./server/package.json

RUN npm install

COPY ./server ./server
COPY ./common-types ./common-types

RUN yarn build:server

CMD ["npm", "run", "start:server"]
