if ! command -v cmake &> /dev/null
then
    echo "cmake could not be found"
    if $1 == "--install"
    then
        echo "Installing cmake"
        sudo apt-get install cmake
    else
        exit 1
    fi
fi

cd src/audio/engine/libsamplerate
yarn install
npx cmake-js compile
cd ../../../../