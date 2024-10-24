#!/bin/sh
cat << EOF > /usr/share/nginx/html/config.js
{
    INFLUX_URL=${INFLUX_URL}
    INFLUX_TOKEN=${INFLUX_TOKEN}
    INFLUX_ORG=${INFLUX_ORG}
    INFLUX_BUCKET=${INFLUX_BUCKET}
}
EOF
