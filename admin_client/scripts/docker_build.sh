#!/bin/bash

# Define variables
IMAGE_NAME="anemo-admin-fe"
VERSION=$(grep -m 1 '"version":' ../package.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
TAG="$VERSION"
DOCKERFILE_PATH="../."
DOCKER_REGISTRY="registry.kororos.eu/anemometer"
STACK_NAME="anemometer"
COMPOSE_FILE="/home/$SUDO_USER/compose/anemometer/docker-compose-anemometer.yml"
COMPOSE_FILE_WITH_ENV_VARS="./compose-with-env-vars.yml"

# Build the Docker image with version as build arg
docker build --build-arg APP_VERSION=$VERSION -t $DOCKER_REGISTRY/$IMAGE_NAME:$TAG $DOCKERFILE_PATH

# Also tag as latest
docker tag $DOCKER_REGISTRY/$IMAGE_NAME:$TAG $DOCKER_REGISTRY/$IMAGE_NAME:latest

# Push the Docker image to the registry
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$TAG
docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest


export APP_VERSION=$VERSION
envsubst < $COMPOSE_FILE > $COMPOSE_FILE_WITH_ENV_VARS

# Update the stack
docker stack deploy -c $COMPOSE_FILE_WITH_ENV_VARS --with-registry-auth $STACK_NAME

rm $COMPOSE_FILE_WITH_ENV_VARS
