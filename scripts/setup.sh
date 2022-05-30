#!/bin/bash

set -e
trap exit INT

cd src/audio/engine/libsamplerate
yarn install
cd -
cd src/audio/engine/play-dl
yarn install
cd -