FROM node:lts-alpine

RUN apk -U upgrade && \
  apk add python3 make gcc g++ git libtool autoconf automake && \
  addgroup -S catrunner && \
  adduser -S catrunner -G catrunner

COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN yarn && npm i pm2 -g

USER root
RUN apk del python3 make gcc g++ git libtool autoconf automake && \
  rm -rf /var/cache/apk/*
USER catrunner

ENTRYPOINT ["pm2-runtime", "src/index.js"]
