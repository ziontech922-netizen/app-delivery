# 🚀 DEPLOY CHECKLIST - Super App

**Manual de Lançamento do Sistema**  
*Versão: 1.0 | Data: Março 2026*

---

## 📋 Sumário

1. [Variáveis de Ambiente](#1-variáveis-de-ambiente)
2. [Serviços Externos](#2-serviços-externos)
3. [Setup de Produção](#3-setup-de-produção)
4. [Comandos de Deploy](#4-comandos-de-deploy)
5. [Testes Obrigatórios (5 Fluxos)](#5-testes-obrigatórios)
6. [Rollback](#6-rollback)
7. [Monitoramento](#7-monitoramento)

---

## 1. Variáveis de Ambiente

### 1.1 Backend (Fly.io)

```bash
# Configurar secrets via CLI
fly secrets set -a superapp-api-beta \
  DATABASE_URL="postgresql://user:pass@host:5432/superapp_beta?sslmode=require" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
```

#### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret para access tokens (min 32 chars) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (min 32 chars) | `openssl rand -base64 32` |

#### Storage (Cloudflare R2)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `S3_ACCESS_KEY_ID` | R2 Access Key | Cloudflare Dashboard > R2 > API Tokens |
| `S3_SECRET_ACCESS_KEY` | R2 Secret Key | Mesmo local |
| `S3_ENDPOINT` | R2 Endpoint | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Nome do bucket | `superapp-uploads` |
| `S3_PUBLIC_URL` | URL pública (com custom domain) | `https://cdn.seuapp.com` |
| `S3_REGION` | Região (sempre `auto` para R2) | `auto` |

#### Pagamentos (Mercado Pago)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de produção | [Mercado Pago Developers](https://www.mercadopago.com.br/developers) |
| `MERCADO_PAGO_PUBLIC_KEY` | Public key | Mesmo local |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secret para validar webhooks | Configurar em Webhook settings |

**Configurar Webhook:**
```
URL: https://superapp-api-beta.fly.dev/api/v1/payments/webhook/mercadopago
Eventos: payment.created, payment.updated
```

#### Push Notifications (Firebase)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `FIREBASE_PROJECT_ID` | ID do projeto | Firebase Console > Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Firebase Console > Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Private key (escapar \n) | JSON da service account |

**Gerar service account:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Extrair valores do JSON

#### AI (OpenAI - Opcional para MVP)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `OPENAI_API_KEY` | API Key | [OpenAI Platform](https://platform.openai.com) |

#### Email (SMTP)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_HOST` | Servidor SMTP | `smtp.sendgrid.net` |
| `SMTP_PORT` | Porta | `587` |
| `SMTP_USER` | Usuário | `apikey` |
| `SMTP_PASS` | Senha/API Key | `SG.xxxxx` |
| `SMTP_FROM` | Email remetente | `noreply@seuapp.com` |
| `APP_NAME` | Nome do app em emails | `Super App` |

### 1.2 Web Client (Vercel/Fly.io)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL da API |
| `NEXT_PUBLIC_BETA_MODE` | `true` para beta |

### 1.3 Mobile (Expo)

Arquivo `.env`:
```env
EXPO_PUBLIC_API_URL=https://superapp-api-beta.fly.dev/api/v1
EXPO_PUBLIC_SOCKET_URL=https://superapp-api-beta.fly.dev
EXPO_PUBLIC_BETA_MODE=true
```

---

## 2. Serviços Externos

### 2.1 Setup Cloudflare R2

```bash
# 1. Criar bucket via dashboard ou wrangler
wrangler r2 bucket create superapp-uploads

# 2. Configurar CORS (via dashboard)
[
  {
    "AllowedOrigins": ["https://seuapp.com", "https://beta.seuapp.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]

# 3. (Opcional) Configurar custom domain
# R2 > Bucket > Settings > Public Access > Connect Domain
```

**Custo estimado:** $0.015/GB armazenamento + $0.36/milhão requisições

### 2.2 Setup Mercado Pago

1. Criar conta em [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Criar aplicação (tipo: Checkout Pro)
3. Obter credenciais de **Produção** (não teste!)
4. Configurar Webhook:
   - URL: `https://sua-api.fly.dev/api/v1/payments/webhook/mercadopago`
   - Eventos: `payment.created`, `payment.updated`
5. Habilitar PIX nas configurações

**Taxas:**
- PIX: 0,99% por transação
- Cartão crédito: 4,98% + liberação em 14 dias

### 2.3 Setup Firebase

1. Criar projeto em [Firebase Console](https://console.firebase.google.com)
2. Ativar Cloud Messaging
3. Gerar service account key (Project Settings > Service Accounts)
4. Configurar APNs para iOS:
   - Apple Developer > Certificates > Push Notification
   - Upload .p8 ou .p12 no Firebase

### 2.4 Setup PostgreSQL (Produção)

**Opções recomendadas:**
- **Neon** (recomendado para Fly.io): `neon.tech`
- **Supabase**: `supabase.com`
- **Railway**: `railway.app`

```bash
# Rodar migrations
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 3. Setup de Produção

### 3.1 Domínios

| Ambiente | API | Web |
|----------|-----|-----|
| **Produção** | `api.seuapp.com` | `seuapp.com` |
| **Beta** | `api-beta.seuapp.com` | `beta.seuapp.com` |

**Configurar no Fly.io:**
```bash
# API
fly certs add api-beta.seuapp.com -a superapp-api-beta

# Web
fly certs add beta.seuapp.com -a superapp-web-beta
```

### 3.2 Banco de Dados

```bash
# Rodar migrations em produção
cd backend
fly ssh console -a superapp-api-beta
npx prisma migrate deploy

# Ou via conexão direta
DATABASE_URL="..." npx prisma migrate deploy
```

### 3.3 Seed de Dados (Beta)

```bash
# Criar admin inicial
fly ssh console -a superapp-api-beta
npx prisma db seed
```

---

## 4. Comandos de Deploy

### 4.1 Deploy Beta

```bash
# Backend
cd backend
fly deploy --config fly.beta.toml

# Web
cd web-client
fly deploy --config fly.beta.toml

# Verificar status
fly status -a superapp-api-beta
fly status -a superapp-web-beta
```

### 4.2 Deploy Produção

```bash
# Backend
cd backend
fly deploy

# Web (Vercel)
cd web-client
vercel --prod

# Ou Fly.io
fly deploy
```

### 4.3 Mobile (EAS Build)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android
cd mobile-client
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview

# Para produção
eas build --platform all --profile production
```

### 4.4 Scripts Úteis

```json
// package.json (root)
{
  "scripts": {
    "deploy:beta:api": "cd backend && fly deploy --config fly.beta.toml",
    "deploy:beta:web": "cd web-client && fly deploy --config fly.beta.toml",
    "deploy:beta": "npm run deploy:beta:api && npm run deploy:beta:web",
    "deploy:prod:api": "cd backend && fly deploy",
    "deploy:prod:web": "cd web-client && vercel --prod",
    "logs:beta:api": "fly logs -a superapp-api-beta",
    "logs:prod:api": "fly logs -a delivery-platform-api"
  }
}
```

---

## 5. Testes Obrigatórios (5 Fluxos)

> ⚠️ **IMPORTANTE:** Todos os 5 fluxos devem passar antes de ir para beta.

### 🔄 Fluxo 1: Explorar App (Cliente)

**Objetivo:** Validar navegação e descoberta de conteúdo

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Abrir app | Ver tela inicial com categorias |
| 2 | Navegar por categorias | Lista de merchants por categoria |
| 3 | Clicar em merchant | Ver detalhes + produtos |
| 4 | Ver produto | Detalhes, preço, variações |
| 5 | Pesquisar "pizza" | Resultados relevantes |
| 6 | Navegar pelo marketplace | Ver listings |
| 7 | Ver feed da comunidade | Posts aparecem |

**Critério de sucesso:** Todas navegações funcionam sem erro

---

### 🛒 Fluxo 2: Fazer Pedido (Cliente)

**Objetivo:** Validar fluxo completo de compra

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Login/cadastro | Autenticação OK |
| 2 | Selecionar merchant | Ver cardápio |
| 3 | Adicionar item ao carrinho | Carrinho atualiza |
| 4 | Adicionar mais itens | Quantidade atualiza |
| 5 | Ir para carrinho | Ver resumo correto |
| 6 | Ir para checkout | Ver total + taxa entrega |
| 7 | Selecionar endereço | Endereço salvo/novo |
| 8 | Escolher PIX | Gerar QR Code |
| 9 | Simular pagamento* | Status muda para PAID |
| 10 | Ver pedido criado | Detalhes do pedido |

*Em beta: usar webhook de teste do MercadoPago

**Critério de sucesso:** Pedido criado com status correto

---

### 📢 Fluxo 3: Criar Anúncio (Marketplace)

**Objetivo:** Validar criação de listing

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Ir para Marketplace | Ver tela de listings |
| 2 | Clicar "Criar Anúncio" | Formulário aparece |
| 3 | Preencher título | Validação OK |
| 4 | Preencher descrição | Campo aceita texto |
| 5 | Definir preço | Formato monetário |
| 6 | Selecionar categoria | Dropdown funciona |
| 7 | Adicionar foto | Upload funciona |
| 8 | Publicar | Anúncio criado |
| 9 | Ver anúncio publicado | Aparece na lista |
| 10 | Editar/excluir | Ações funcionam |

**Critério de sucesso:** Anúncio visível no marketplace

---

### 💬 Fluxo 4: Chat

**Objetivo:** Validar comunicação em tempo real

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Ver um listing | Detalhes aparecem |
| 2 | Clicar "Conversar" | Abre chat |
| 3 | Enviar mensagem | Mensagem aparece |
| 4 | (Outro usuário) Receber | Mensagem chega |
| 5 | (Outro usuário) Responder | Resposta aparece |
| 6 | Enviar imagem | Upload e preview |
| 7 | Ver histórico | Mensagens anteriores |
| 8 | Voltar e reabrir chat | Histórico mantido |

**Critério de sucesso:** Mensagens em tempo real OK

---

### 🚗 Fluxo 5: Entregador Aceitar Pedido

**Objetivo:** Validar app do entregador

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Login (app driver) | Autenticação OK |
| 2 | Ficar online | Status muda |
| 3 | Aguardar pedido* | Notificação chega |
| 4 | Ver detalhes do pedido | Info completa |
| 5 | Aceitar pedido | Status ACCEPTED |
| 6 | Ver rota no mapa | Deep link Google Maps |
| 7 | Clicar "Coletei" | Status PICKED_UP |
| 8 | Ir para endereço | Navegação funciona |
| 9 | Clicar "Entreguei" | Pede foto |
| 10 | Tirar foto | Upload OK |
| 11 | Confirmar entrega | Status DELIVERED |
| 12 | Ver ganhos | Valor atualizado |

*Criar pedido no app cliente primeiro

**Critério de sucesso:** Pedido finalizado com foto

---

### ✅ Checklist de Teste

```markdown
## Resultado dos Testes

Data: ___/___/______
Testador: _______________
Ambiente: [ ] Beta [ ] Produção

### Fluxos

- [ ] Fluxo 1: Explorar App
  - [ ] Navegação OK
  - [ ] Busca OK
  - [ ] Imagens carregam

- [ ] Fluxo 2: Fazer Pedido
  - [ ] Carrinho OK
  - [ ] Checkout OK
  - [ ] PIX gerado
  - [ ] Webhook recebido
  - [ ] Status atualizado

- [ ] Fluxo 3: Criar Anúncio
  - [ ] Formulário OK
  - [ ] Upload OK
  - [ ] Publicação OK

- [ ] Fluxo 4: Chat
  - [ ] Mensagens OK
  - [ ] Tempo real OK
  - [ ] Imagens OK

- [ ] Fluxo 5: Entregador
  - [ ] Aceite OK
  - [ ] Navegação OK
  - [ ] Foto OK
  - [ ] Finalização OK

### Problemas Encontrados

1. ___________________________
2. ___________________________
3. ___________________________

### Aprovação

[ ] APROVADO para beta
[ ] REPROVADO - correções necessárias
```

---

## 6. Rollback

### 6.1 Rollback Fly.io

```bash
# Ver releases anteriores
fly releases -a superapp-api-beta

# Rollback para versão específica
fly releases rollback v15 -a superapp-api-beta
```

### 6.2 Rollback Database

```bash
# Ver histórico de migrations
npx prisma migrate status

# Rollback (manual - criar migration down)
npx prisma migrate resolve --rolled-back "migration_name"
```

### 6.3 Rollback Mobile

- Android: Unpublish no Google Play Console
- iOS: Remove from App Store Connect

---

## 7. Monitoramento

### 7.1 Logs

```bash
# Fly.io logs em tempo real
fly logs -a superapp-api-beta

# Filtrar por severidade
fly logs -a superapp-api-beta | grep -i error
```

### 7.2 Métricas Fly.io

Dashboard: `https://fly.io/apps/superapp-api-beta/metrics`

### 7.3 Health Check

```bash
# Verificar saúde da API
curl https://superapp-api-beta.fly.dev/health

# Resposta esperada
{"status":"ok","timestamp":"..."}
```

### 7.4 Alertas Recomendados

1. **Uptime Robot** (gratuito): Monitor HTTP
2. **Sentry**: Error tracking
3. **Logtail/Papertrail**: Log aggregation

```bash
# Configurar Sentry no Fly.io
fly secrets set SENTRY_DSN="https://xxx@sentry.io/xxx" -a superapp-api-beta
```

---

## Anexo: Checklist Pré-Deploy

```markdown
## Checklist Final

### Código
- [ ] Build local sem erros
- [ ] Testes passando
- [ ] Sem console.log excessivos
- [ ] Sem credenciais no código

### Configuração
- [ ] Todas env vars configuradas
- [ ] Domains configurados
- [ ] SSL ativo

### Serviços Externos
- [ ] R2 bucket criado e CORS configurado
- [ ] MercadoPago webhook configurado
- [ ] Firebase service account configurada
- [ ] PostgreSQL migrations rodadas

### Mobile
- [ ] .env correto
- [ ] Builds geradas
- [ ] Testado em device real

### Documentação
- [ ] README atualizado
- [ ] API documentada (Swagger)
- [ ] Runbook de emergência

### Backup
- [ ] Snapshot do banco antes do deploy
- [ ] Versão anterior taggeada no Git
```

---

*Documento gerado em Março 2026*
*Super App - Hub de Negócios Locais*
