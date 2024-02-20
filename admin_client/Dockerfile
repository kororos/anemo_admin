# develop stage
FROM node:current-alpine as develop-stage
WORKDIR /app
COPY package*.json ./
RUN npm i -g @quasar/cli
COPY . .

# build stage
FROM develop-stage as build-stage
RUN npm install
#RUN WS_BASE_URL=wss://wsanemo.kororos.eu/ws/admin API_BASE_URL=https://wsanemo.kororos.eu quasar build
RUN WS_BASE_URL=ws://anemo-admin-be:3000/ws/admin API_BASE_URL=http://anemo-admin-be:3000 quasar build

# production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html
EXPOSE 9000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
