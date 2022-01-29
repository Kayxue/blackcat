FROM node:lts-bullseye

RUN apt update && apt upgrade -y && \
  apt install python3 gcc make -y && \
  useradd -u 1100 -m -U catrunner

COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN npm install && npm install pm2

USER root
RUN apt remove gcc make -y
USER catrunner

ENTRYPOINT ["pm2-runtime", "src/index.js"]