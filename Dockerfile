FROM node:17.8.0

WORKDIR /app

COPY package*.json ./

RUN apt-get update

RUN apt-get install -y vim

RUN npm install

COPY . .

EXPOSE 9000

CMD ["node", "index.js"]