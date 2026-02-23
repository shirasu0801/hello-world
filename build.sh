#!/bin/bash
EMCC="python /c/emsdk/upstream/emscripten/emcc.py"

echo "Building Legend of the Hello World WASM..."

$EMCC \
  src/Player.cpp \
  src/Enemy.cpp \
  src/Item.cpp \
  src/GameState.cpp \
  src/MapData.cpp \
  src/Battle.cpp \
  src/Shop.cpp \
  src/wasm/Bridge.cpp \
  -o web/wasm/game.js \
  -std=c++17 \
  -O2 \
  --bind \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web \
  -Isrc

if [ $? -eq 0 ]; then
    echo "Build successful! Output: web/wasm/game.js, web/wasm/game.wasm"
else
    echo "Build FAILED!"
    exit 1
fi
