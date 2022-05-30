@echo off

git submodule update --recursive --init
echo Chaning directory
cd .\src\audio\engine\libsamplerate
echo Running build... Building libsamplerate
start "libsamplerate" yarn install
echo Chaning directory
cd ..\play-dl
echo Running build... Building play-dl
start "play-dl" yarn install
echo Restoring
cd ..\..\..\..\
