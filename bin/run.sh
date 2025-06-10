#!/usr/bin/env zsh
echo "Start $(date)\n"

cd "$(dirname "$0")/.."

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

nvm use

node --require tsconfig-paths/register --require ts-node/register src/main.ts
echo "\nEnd $(date)"



