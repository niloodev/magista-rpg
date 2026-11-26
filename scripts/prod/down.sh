#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env
compose stop
echo "Mesa desligada. Os dados continuam guardados; para ligar de novo: npm run prod:up"
