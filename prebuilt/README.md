# Building Addons

Script to rebuild native modules (e.g. midi)
Must be run natively per platform

> node-gyp rebuild --target=<electron version> --arch=x64 --dist-url=https://atom.io/download/atom-shell --build-from-source --abi=50