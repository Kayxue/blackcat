FROM node:lts-alpine

# Install node-gyp required deps
RUN apk -U upgrade && \
  apk add python3 make gcc g++ && \
  addgroup -S catrunner && \
  adduser -S catrunner -G catrunner

# Copy project
COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

# Install Nodejs deps
USER catrunner
RUN npm install && npm install pm2

# Remove node-gyp required deps
USER root
RUN apk del python3 make gcc g++ && \
  rm -rf /var/cache/apk/*
USER catrunner

ENTRYPOINT ["pm2-runtime", "src/index.js"]