#!/bin/bash

set -e
trap exit INT

git submodule update --recursive --init
cd src/audio/engine/libsamplerate
yarn install
cd -
cd src/audio/engine/play-dl
yarn install
cd -