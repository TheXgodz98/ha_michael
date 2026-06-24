ARG BUILD_FROM
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=frontend-build /app/dist /server/public

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 8099
CMD [ "/run.sh" ]
