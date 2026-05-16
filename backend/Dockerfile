FROM node:24.10.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=5000

ENV SPAWN_PYTHON=false

EXPOSE 5000

CMD [ "node", "server.js" ]