#!/bin/bash

set -e
trap exit INT

cd src/audio/engine/libsamplerate
yarn install
cd -