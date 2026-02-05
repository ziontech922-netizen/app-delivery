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
│   │   │   └── health/       # Health checks
│   │   ├── shared/           # Código compartilhado
│   │   │   ├── prisma/       # Serviço do Prisma
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
| `JWT_SECRET` | Chave secreta para tokens JWT | ✅ |
| `JWT_REFRESH_SECRET` | Chave para refresh tokens | ✅ |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | ❌ (default: 15m) |
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

*Endpoints serão documentados conforme implementação*

## 🛡️ Segurança

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
