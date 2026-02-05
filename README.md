# Delivery Platform

Marketplace de delivery profissional, escalável e moderno.

## 🏗️ Arquitetura

- **Backend**: NestJS + TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL (Fly.io)
- **Cache**: Redis
- **Deploy**: Fly.io (containers Docker)
- **Arquitetura**: Monólito modular

## 📁 Estrutura do Projeto

```
delivery-platform/
├── backend/
│   ├── src/
│   │   ├── modules/          # Módulos de domínio
│   │   │   ├── auth/         # Autenticação e autorização
│   │   │   ├── users/        # Gestão de usuários
│   │   │   ├── merchants/    # Gestão de estabelecimentos
│   │   │   ├── products/     # Produtos e categorias
│   │   │   ├── orders/       # Pedidos
│   │   │   ├── realtime/     # WebSocket / Socket.IO
│   │   │   └── health/       # Health checks
│   │   ├── shared/           # Código compartilhado
│   │   │   ├── prisma/       # Serviço do Prisma
│   │   │   ├── redis/        # Serviço do Redis (cache/pubsub)
│   │   │   ├── guards/       # Guards de autenticação
│   │   │   ├── decorators/   # Decorators customizados
│   │   │   └── filters/      # Exception filters
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma     # Schema do banco
│   ├── Dockerfile
│   └── fly.toml
├── .env.example
├── README.md
├── PRIVACY.md
├── TERMS.md
└── .gitignore
```

## 🚀 Setup Local

### Pré-requisitos

- Node.js 20+
- npm ou yarn
- Docker e Docker Compose (para PostgreSQL local)
- Fly CLI (para deploy)

### 1. Clonar e instalar dependências

```bash
git clone <repository-url>
cd delivery-platform/backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Subir banco de dados local (Docker)

```bash
# Na raiz do projeto
docker run --name postgres-delivery \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=delivery_platform \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 4. Executar migrations

```bash
cd backend
npx prisma migrate dev
```

### 5. Iniciar em modo desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

## 📊 Comandos Prisma

```bash
# Criar nova migration
npx prisma migrate dev --name <nome_da_migration>

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio (GUI para o banco)
npx prisma studio

# Regenerar cliente Prisma
npx prisma generate

# Reset do banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset
```

## 🌐 Deploy no Fly.io

### 1. Instalar Fly CLI

```bash
# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

### 2. Login no Fly.io

```bash
fly auth login
```

### 3. Criar aplicação (primeira vez)

```bash
cd backend
fly launch --no-deploy
```

### 4. Criar banco PostgreSQL

```bash
fly postgres create --name delivery-platform-db --region gru
fly postgres attach delivery-platform-db
```

### 5. Configurar secrets

```bash
fly secrets set JWT_SECRET="<sua-chave-segura>"
fly secrets set JWT_REFRESH_SECRET="<outra-chave-segura>"
```

### 6. Deploy

```bash
fly deploy
```

### 7. Verificar status

```bash
# Ver logs
fly logs

# Abrir no navegador
fly open

# Status da aplicação
fly status
```

## 🔒 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | ✅ |
| `JWT_ACCESS_SECRET` | Chave secreta para access tokens JWT | ✅ |
| `JWT_REFRESH_SECRET` | Chave para refresh tokens | ✅ |
| `JWT_ACCESS_EXPIRES_IN` | Tempo de expiração do access token | ❌ (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Tempo de expiração do refresh token | ❌ (default: 7d) |
| `REDIS_URL` | URL de conexão Redis | ❌ (modo degradado se ausente) |
| `PORT` | Porta da aplicação | ❌ (default: 3000) |
| `NODE_ENV` | Ambiente (development/production) | ❌ |
| `CORS_ORIGINS` | Origens permitidas para CORS | ❌ |

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📝 Endpoints Principais

### Health Check

- `GET /health` - Status básico
- `GET /health/details` - Status detalhado com dependências
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### API (prefixo `/api/v1`)

#### Autenticação (`/api/v1/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Cadastro de usuário | ❌ |
| POST | `/auth/login` | Login | ❌ |
| POST | `/auth/refresh` | Renovar access token | ❌ |
| POST | `/auth/logout` | Logout (revogar refresh) | ❌ |
| POST | `/auth/logout-all` | Logout de todos os dispositivos | ✅ |
| GET | `/auth/me` | Dados do usuário logado | ✅ |

##### Exemplos de uso

**Registro:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "Senha123!",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "Senha123!"
  }'
```

**Resposta do Login/Registro:**
```json
{
  "user": {
    "id": "cuid...",
    "email": "usuario@email.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "CUSTOMER",
    "status": "PENDING_VERIFICATION"
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "abc123...",
    "expiresIn": 900
  }
}
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "abc123..."}'
```

**Rota autenticada:**
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbG..."
```

#### Usuários (`/api/v1/users`) - Admin only

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/users` | Listar usuários | ✅ ADMIN |
| GET | `/users/:id` | Buscar usuário | ✅ ADMIN |
| PATCH | `/users/:id/status` | Alterar status | ✅ ADMIN |
| PATCH | `/users/:id/role` | Alterar role | ✅ ADMIN |

## � WebSocket / Realtime

O sistema utiliza Socket.IO para comunicação em tempo real entre clientes e servidor.

### Conectando ao WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'seu_jwt_access_token'
  },
  transports: ['websocket', 'polling']
});

// Alternativa: via header
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: 'Bearer seu_jwt_access_token'
  }
});

// Alternativa: via query string
const socket = io('http://localhost:3000?token=seu_jwt_access_token');
```

### Eventos de Conexão

```javascript
// Conexão bem-sucedida
socket.on('connection:success', (data) => {
  console.log('Conectado!', data);
  // { userId: "...", socketId: "...", rooms: ["user:id", "customer:id"] }
});

// Erro de conexão
socket.on('connection:error', (data) => {
  console.error('Erro:', data.error);
});
```

### Salas Automáticas

Ao conectar, o usuário entra automaticamente nas salas baseadas em seu role:

| Role | Salas |
|------|-------|
| CUSTOMER | `user:{userId}`, `customer:{userId}` |
| MERCHANT | `user:{userId}`, `merchant:{merchantId}` |
| DRIVER | `user:{userId}`, `driver:{driverId}` (futuro) |

### Entrar em Sala de Pedido

```javascript
// Entrar na sala de um pedido específico (validação de ownership)
socket.emit('order:join', { orderId: 'uuid-do-pedido' }, (response) => {
  if (response.success) {
    console.log('Entrou na sala:', response.room);
  } else {
    console.error('Erro:', response.error);
  }
});

// Sair da sala
socket.emit('order:leave', { orderId: 'uuid-do-pedido' });
```

### Eventos de Pedidos

```javascript
// Novo pedido criado (merchant recebe)
socket.on('order:created', (data) => {
  console.log('Novo pedido!', data);
  // {
  //   orderId: "...",
  //   orderNumber: "20260205-ABC123",
  //   customerId: "...",
  //   merchantId: "...",
  //   total: 59.90,
  //   itemsCount: 3,
  //   createdAt: "2026-02-05T12:00:00.000Z"
  // }
});

// Status do pedido atualizado
socket.on('order:status_updated', (data) => {
  console.log('Status atualizado!', data);
  // {
  //   orderId: "...",
  //   orderNumber: "20260205-ABC123",
  //   previousStatus: "PENDING",
  //   newStatus: "CONFIRMED",
  //   updatedAt: "2026-02-05T12:05:00.000Z"
  // }
});

// Pedido cancelado
socket.on('order:cancelled', (data) => {
  console.log('Pedido cancelado!', data);
  // {
  //   orderId: "...",
  //   orderNumber: "20260205-ABC123",
  //   cancelledBy: "merchant",
  //   reason: "Produto indisponível",
  //   cancelledAt: "2026-02-05T12:10:00.000Z"
  // }
});
```

### Heartbeat (Keep-alive)

```javascript
// Enviar ping para manter presença ativa
setInterval(() => {
  socket.emit('ping', {}, (response) => {
    console.log('Pong:', response.timestamp);
  });
}, 60000); // A cada 1 minuto
```

### Eventos de Sala

```javascript
socket.on('room:joined', (data) => {
  console.log('Entrou na sala:', data.room);
});

socket.on('room:left', (data) => {
  console.log('Saiu da sala:', data.room);
});

socket.on('room:error', (data) => {
  console.error('Erro na sala:', data.room, data.error);
});
```

### Redis (Cache)

O sistema usa Redis para:
- **Presença online**: Saber quais usuários estão conectados
- **Cache de status**: Cache rápido do status dos pedidos
- **Pedidos ativos**: Cache dos pedidos ativos por merchant

⚠️ **Modo Degradado**: Se o Redis não estiver disponível, o sistema continua funcionando normalmente, apenas sem cache/presença.

## �🛡️ Segurança

- Senhas hashadas com Argon2
- JWT com refresh tokens
- RBAC (Role-Based Access Control)
- Validação de DTOs
- Nenhuma chave hardcoded
- CORS configurável
- HTTPS obrigatório em produção

## 📜 Documentação Legal

- [Política de Privacidade](./PRIVACY.md)
- [Termos de Uso](./TERMS.md)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commits seguindo conventional commits
3. Abra um Pull Request

## 📄 Licença

Projeto privado - Todos os direitos reservados.
