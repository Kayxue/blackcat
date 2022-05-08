FROM node:lts-alpine

RUN apk add --no-cache python3 make gcc g++ git libtool autoconf automake cmake bash && \
  addgroup -S catrunner && \
  adduser -S catrunner -G catrunner

COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN yarn install

USER root
RUN apk del python3 make gcc g++ git libtool autoconf automake cmake
USER catrunner

ENTRYPOINT ["bash", "start.sh"]
