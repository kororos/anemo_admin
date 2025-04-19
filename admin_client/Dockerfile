# develop stage
FROM node:lts-alpine AS develop-stage
WORKDIR /app
COPY package*.json ./
RUN npm i -g @quasar/cli
COPY . .

# build stage
FROM develop-stage AS build-stage
# Accept version as build argument
ARG APP_VERSION
RUN npm install
RUN WS_BASE_URL=wss://wsanemo.kororos.eu/ws/admin \
    API_BASE_URL=https://wsanemo.kororos.eu \
    GOOGLE_REDIRECT_URI=https://wsanemo.kororos.eu/session/oauth/google \
    GOOGLE_CLIENT_ID=793768332648-i9b67c88bg1qlasv6rh4lq1cn734eja9.apps.googleusercontent.com \
    VUE_APP_VERSION=$APP_VERSION \
    INFLUX_URL=https://influxdb.kororos.eu \
    INFLUX_TOKEN=Odz3zj00upwWqMz42ZWUyYMyOX5aYe6fy9dZm1mDqUigYeFSVFt5gGVAZj2AZpr2bAzkLhLHKMsVlYmlBZouKA== \
    INFLUX_ORG=corenet-solutions \
    INFLUX_BUCKET=anemo \
    quasar build
#RUN WS_BASE_URL=ws://anemo-admin-be:3000/ws/admin API_BASE_URL=http://anemo-admin-be:3000 quasar build

# production stage
FROM nginx:alpine AS production-stage
# Pass version info to container
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html
EXPOSE 9000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
