# develop stage
FROM node:current-alpine as develop-stage
WORKDIR /app
COPY package*.json ./
RUN npm i -g @quasar/cli
COPY . .

# build stage
FROM develop-stage as build-stage
RUN npm install
RUN quasar build

# production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
