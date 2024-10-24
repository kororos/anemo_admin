# develop stage
FROM node:current-alpine as develop-stage
WORKDIR /app
COPY package*.json ./
RUN npm i -g @quasar/cli
COPY . .

# build stage
FROM develop-stage as build-stage
RUN npm install
RUN WS_BASE_URL=wss://wsanemo.kororos.eu/ws/admin API_BASE_URL=https://wsanemo.kororos.eu GOOGLE_REDIRECT_URI=https://wsanemo.kororos.eu/session/oauth/google GOOGLE_CLIENT_ID=793768332648-i9b67c88bg1qlasv6rh4lq1cn734eja9.apps.googleusercontent.com quasar build
#RUN WS_BASE_URL=ws://anemo-admin-be:3000/ws/admin API_BASE_URL=http://anemo-admin-be:3000 quasar build

# production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html
COPY config.sh /app/config.sh
RUN chmod +x /app/config.sh
EXPOSE 9000
#ENTRYPOINT ["nginx", "-g", "daemon off;"]
CMD ["/bin/sh", "-c", "/app/config.sh && nginx -g 'daemon off;'"]
