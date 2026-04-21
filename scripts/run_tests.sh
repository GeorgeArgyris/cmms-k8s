#!/bin/bash

# start postgres (fire-and-forget, same as your command)
docker run -d \
  -e POSTGRES_DB=cmmsdb \
  -e POSTGRES_USER=cmmsuser \
  -e POSTGRES_PASSWORD=cmmspass \
  -p 5432:5432 \
  postgres:15-alpine

# run tests
cd ../backend || exit 1

NODE_ENV=test \
JWT_SECRET=test-secret \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=cmmsdb \
DB_USER=cmmsuser \
DB_PASS=cmmspass \
npm test