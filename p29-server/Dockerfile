FROM node:12.13.1-alpine3.10

WORKDIR /usr/app

COPY . .

RUN rm -rf node_modules && apk add --no-cache --virtual .gyp python make g++ && npm install --quiet


