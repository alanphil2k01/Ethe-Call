FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY ./server/package.json ./server/package.json
COPY ./common-types ./common-types

RUN yarn install

COPY ./server ./server

RUN yarn build:server

CMD ["npm", "run", "start:server"]
