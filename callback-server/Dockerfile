FROM node:current-slim

RUN mkdir /app
WORKDIR /app
COPY . ./
RUN npm install
EXPOSE 3002

CMD [ "npm", "run", "start" ]
