FROM node:current

RUN apt update && apt install -qqy python3 make gcc g++ git libtool autoconf automake cmake bash && \
  useradd catrunner

ENV HUSKY=0
ARG IN_DOCKER=1

SHELL [ "/bin/bash", "-c" ]
COPY --chown=catrunner:catrunner . /home/catrunner/
WORKDIR /home/catrunner/

USER catrunner
RUN echo "network-timeout 600000"> ~/.yarnrc && yarn install

USER root
RUN apt remove -qqy python3 make gcc g++ git libtool autoconf automake cmake
USER catrunner

ENTRYPOINT ["node", "src/index.js"]