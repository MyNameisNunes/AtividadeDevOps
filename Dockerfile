# syntax=docker/dockerfile:1

# ---------- Etapa 1: dependências de produção ----------
FROM node:24-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---------- Etapa 2: imagem final ----------
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_FILE=/app/data/pessoas.json \
    TZ=America/Sao_Paulo

WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY backend/src ./backend/src
COPY frontend ./frontend

# a aplicação roda sem privilégios de root; só a pasta de dados é gravável
RUN mkdir -p /app/data && chown node:node /app/data
USER node

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "backend/src/server.js"]
