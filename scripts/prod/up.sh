#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env
compose up -d --build --remove-orphans
wait_healthy
