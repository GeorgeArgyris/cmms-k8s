#!/usr/bin/env bash
set -e

echo "🧪 Starting test database..."

docker compose -f ../docker-compose.test.yml up -d

echo "⏳ Waiting for database..."

until docker exec cmms-test-db pg_isready -U cmmsuser >/dev/null 2>&1; do
  sleep 1
done

echo "✅ Database ready"

cd ../backend || exit 1

NODE_ENV=test \
JWT_SECRET=test-secret \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=cmmsdb \
DB_USER=cmmsuser \
DB_PASS=cmmspass \
npm test

echo "🧹 Stopping test database..."

docker compose -f docker-compose.test.yml down -v