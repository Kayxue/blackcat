FROM node:lts-bullseye

RUN apt update && apt upgrade -y && \
  useradd -u 1100 -m -U catrunner

COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN npm install && npm install pm2

ENTRYPOINT ["pm2-runtime", "src/index.js"]