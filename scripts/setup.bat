@echo off

git submodule update --recursive --init
echo Chaning directory
cd .\src\audio\engine\libsamplerate
echo Running build... Building libsamplerate
start "libsamplerate" yarn install
echo Restoring
cd ..\..\..\..\
