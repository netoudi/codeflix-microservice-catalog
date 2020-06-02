#!/bin/bash

## On error no such file entrypoint.sh, execute in terminal - dos2unix .docker\entrypoint.sh

## set global cache npm
npm config set cache --global /home/node/app/.docker/.cache/npm

## install dependencies
npm install

## environments
if [ ! -f ".env" ]; then
  cp .env.example .env
fi

## run server
npm run start
