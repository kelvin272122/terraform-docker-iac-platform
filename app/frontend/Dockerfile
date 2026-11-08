FROM node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS build

WORKDIR /app

COPY app/frontend/package.json app/frontend/package-lock.json ./
RUN npm ci

COPY app/frontend/ ./
RUN npm run build

FROM nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855 AS runtime

COPY --from=build /app/dist/iac-panel-frontend/browser/ /usr/share/nginx/html/
COPY app/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY app/nginx/api-proxy.conf /etc/nginx/api-proxy.conf

USER 101
EXPOSE 8080
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
