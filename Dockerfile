FROM node:12.17-alpine

RUN apk update \
    && apk add --no-cache bash vim git

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

## config bash
RUN touch /root/.bashrc | echo "PS1='\w \$ '" >> /root/.bashrc

## install loopback global
RUN npm install -g @loopback/cli

RUN mkdir -p /home/node/app

WORKDIR /home/node/app
