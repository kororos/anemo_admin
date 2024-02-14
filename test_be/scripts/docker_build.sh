#!/bin/bash

# Define variables
IMAGE_NAME="anemo-admin-be"
TAG="latest"
DOCKERFILE_PATH="../."
DOCKER_REGISTRY="registry.kororos.eu/anemometer"
STACK_NAME="anemometer"
COMPOSE_FILE="/home/$SUDO_USER/compose/anemometer/docker-compose-anemometer.yml"

# Build the Docker image
docker build -t $DOCKER_REGISTRY/$IMAGE_NAME:$TAG $DOCKERFILE_PATH

# Tag the Docker image
#docker tag $IMAGE_NAME:$TAG $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# Push the Docker image to the registry
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# Update the stack
docker stack deploy -c $COMPOSE_FILE --with-registry-auth $STACK_NAME
