# Delivery Platform Backend - Dockerfile
# Multi-stage build para produção

# ===========================================
# Stage 1: Dependencies
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Instalar dependências do sistema para Prisma
RUN apk add --no-cache libc6-compat openssl

# Copiar arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# ===========================================
# Stage 2: Builder
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema para Prisma
RUN apk add --no-cache libc6-compat openssl

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Regenerar cliente Prisma com schema atualizado
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# ===========================================
# Stage 3: Production
# ===========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat openssl dumb-init

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Copiar arquivos necessários
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Trocar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Iniciar aplicação (migrations são rodadas separadamente)
CMD ["node", "dist/main"]
