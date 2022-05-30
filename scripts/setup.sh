#!/bin/bash

set -e
trap exit INT

if [[ -z "${IN_DOCKER}" ]]; then
  git submodule update --recursive --init
fi
cd src/audio/engine/libsamplerate
yarn install
cd -
cd src/audio/engine/play-dl
yarn install
cd -