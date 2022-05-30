@echo off

cd .\src\audio\engine\libsamplerate
yarn install
cd ..\play-dl
yarn install
cd ..\..\..\..\