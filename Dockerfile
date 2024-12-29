FROM node:20-alpine3.17

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

COPY ./dist ./

RUN npx prisma generate

CMD ["npm", "run", "start:prod"]
