#!/bin/sh
set -e

# Railway provides PORT environment variable
PORT=${PORT:-8080}

echo "Starting server on port $PORT..."
echo "PORT environment variable: $PORT"

# Start serve with the correct port
exec npx serve -s dist -p $PORT -n
