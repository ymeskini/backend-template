FROM node:20-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json package-lock.json .swcrc tsconfig.json /app/
COPY src /app/src

RUN npm ci && npm cache clean --force
RUN npm i @swc/core --save-dev
RUN npm run build

EXPOSE 4444

CMD ["npm", "run", "dev"]