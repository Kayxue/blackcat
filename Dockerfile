FROM node:lts-alpine

RUN apk add --no-cache python3 make gcc g++ git libtool autoconf automake cmake && \
  addgroup -S catrunner && \
  adduser -S catrunner -G catrunner

COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN bash setup.sh && yarn cache clean

USER root
RUN apk del python3 make gcc g++ git libtool autoconf automake cmake
USER catrunner

ENTRYPOINT ["bash", "start.sh"]
