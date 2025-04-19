#!/bin/sh
# entrypoint.sh

# Run migrations
echo "Running database migrations..."
npx sequelize db:migrate

# Start the application
echo "Starting the application..."
exec "$@"

