set -e
trap exit INT

build() {
  cd src/audio/engine/libsamplerate
  yarn install
  yarn build
  cd -
}

if [ "$1" == "--gitpod" ]
then
  sudo apt-get install -qqy cmake
  sudo apt-get remove -qqy ninja-build
  yarn install
elif [ ! command -v cmake &> /dev/null ]
then
  echo "Cannot find cmake"
  if "$1" == "--install"
  then
    echo "Installing cmake by --install flag"
    sudo apt-get -qqy install cmake
    build
  else
    exit 1
  fi
else
  build
fi
