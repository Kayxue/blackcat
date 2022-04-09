if [ "$1" == "--gitpod" ]
then
  sudo apt-get install -qqy cmake
  sudo apt-get remove -qqy ninja-build
else
  if [ ! command -v cmake &> /dev/null ]
  then
      echo "cmake could not be found"
      if "$1" == "--install"
      then
          echo "Installing cmake"
          sudo apt-get -qqy install cmake
      else
          exit 1
      fi
  fi
fi

cd src/audio/engine/libsamplerate
yarn install
yarn build
cd -