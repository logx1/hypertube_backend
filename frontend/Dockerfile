FROM node:latest

WORKDIR /app

COPY ./my-react-app/ /app

COPY ./start.sh /



RUN npm install -g npm@12.0.0

RUN npm install --legacy-peer-deps

EXPOSE 3000

# RUN npm run build

CMD ["bash", "/start.sh"]
