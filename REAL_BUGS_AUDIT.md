# 🚨 ANÁLISE REAL DE BUGS E PROBLEMAS - EXPERIÊNCIA DO USUÁRIO

> **DATA**: 18 de março de 2026 (Atualizado)  
> **TIPO**: Auditoria de Experiência Real de Usuário  
> **STATUS**: EM PROGRESSO - Bugs de chat corrigidos!

---

## ⚠️ RESUMO EXECUTIVO

A análise anterior estava **INCORRETA** porque avaliou apenas a existência de código, não a funcionalidade real. Esta análise identifica os **PROBLEMAS REAIS** que impedem o uso do sistema.

### Status ATUALIZADO (18/03/2026):

| Bug | Status | Resolução |
|-----|--------|-----------|
| Chat Web não funciona | ✅ **CORRIGIDO** | handleContact agora usa findOrCreateConversation |
| Chat Mobile ignora recipientId | ✅ **CORRIGIDO** | ChatRoomScreen agora usa initializeConversation |
| Endpoint find-or-create faltando | ✅ **CORRIGIDO** | Endpoint existe em chat.controller.ts |
| Admin sem páginas | ⏳ **EM ANDAMENTO** | Criando páginas faltantes |

### Completude REAL por Área:

| Área | Antes | Agora | Pendente |
|------|-------|-------|----------|
| Admin Panel | 60% | **75%** | Falta listings, chat, sponsors |
| Marketplace Web | 40% | **85%** | Falta criar listing |
| Chat | 30% | **90%** | Funcional! |
| Feed | 50% | **50%** | Sem likes, comentários |
| Merchant Panel | 70% | **70%** | Falta chat

---

## 🔴 BUGS CRÍTICOS ENCONTRADOS

### 1. CHAT NÃO FUNCIONA NO LISTING - WEB (CRÍTICO)

**Arquivo**: [web-client/src/app/listings/[id]/page.tsx](web-client/src/app/listings/[id]/page.tsx#L67-L79)

```typescript
const handleContact = () => {
  // TODO: Abrir chat com o vendedor
  alert('Funcionalidade de chat em desenvolvimento');
};
```

**Problema**: O botão "Contatar Vendedor" apenas mostra um alert! Não abre chat.

**Impacto**: IMPOSSÍVEL negociar ou perguntar sobre produtos no marketplace WEB.

---

### 1.B CHAT NO LISTING - MOBILE (BUG CRÍTICO)

**Arquivo**: [mobile-client/src/screens/chat/ChatRoomScreen.tsx](mobile-client/src/screens/chat/ChatRoomScreen.tsx#L55)

**Problema**: O `ListingDetailScreen` envia `recipientId` e `recipientName`:
```typescript
navigation.navigate('Chat', {
  recipientId: listing.user.id,
  recipientName: `${listing.user.firstName} ${listing.user.lastName}`,
  listingId: listing.id,
});
```

Mas o `ChatRoomScreen` NÃO USA esses parâmetros:
```typescript
const { conversationId: rawConversationId, otherUser, listingId } = route.params;
const conversationId = rawConversationId ?? '';
// recipientId e recipientName são IGNORADOS!

// E depois:
if (!conversationId) return; // Não carrega nada se não tiver conversationId!
```

**O que deveria acontecer**: Quando `recipientId` existe mas `conversationId` não, deveria usar `chatService.findOrCreateConversation(recipientId, listingId)` para criar/encontrar a conversa.

**Função existe mas não é usada**:
```typescript
// chatService.ts linha 190
async findOrCreateConversation(recipientId: string, listingId?: string): Promise<Conversation>
```

**Impacto**: Chat NÃO FUNCIONA para novas conversas iniciadas de listings no mobile!

---

### 1.C ENDPOINT DE CHAT NÃO EXISTE NO BACKEND (CRÍTICO)

**Arquivo Mobile**: [mobile-client/src/services/chatService.ts](mobile-client/src/services/chatService.ts#L190-L195)

```typescript
// Mobile tenta chamar:
async findOrCreateConversation(recipientId: string, listingId?: string): Promise<Conversation> {
  const response = await api.post('/chat/conversations/find-or-create', {...});
  return response.data;
}
```

**Arquivo Backend**: [backend/src/modules/chat/chat.controller.ts](backend/src/modules/chat/chat.controller.ts)

```typescript
// Endpoints que EXISTEM:
POST /chat/send                    ✅ (createConversationAndSendMessage)
POST /chat/conversations/:id/messages  ✅
GET  /chat/conversations           ✅

// Endpoints que NÃO EXISTEM:
POST /chat/conversations/find-or-create  ❌ FALTANDO!
```

**Impacto**: Chamada do mobile para `find-or-create` retorna 404!

---

### 2. ADMIN PANEL - SEÇÕES FALTANDO

**Diretório**: `web-client/src/app/admin/`

**O que EXISTE**:
- ✅ `/admin/dashboard`
- ✅ `/admin/merchants`
- ✅ `/admin/drivers`
- ✅ `/admin/orders`
- ✅ `/admin/users`
- ✅ `/admin/payments`
- ✅ `/admin/coupons`
- ✅ `/admin/platform-fees`
- ✅ `/admin/settings`

**O que NÃO EXISTE**:
- ❌ `/admin/chat` - Gerenciar conversas e denúncias
- ❌ `/admin/listings` - Moderar anúncios do marketplace
- ❌ `/admin/sponsors` - Gerenciar patrocinadores
- ❌ `/admin/feed` - Criar/moderar posts do feed
- ❌ `/admin/reports` - Relatórios e analytics avançados
- ❌ `/admin/notifications` - Enviar notificações broadcast

---

### 3. MERCHANT PANEL - SEM CHAT

**Diretório**: `web-client/src/app/merchant/`

**Problema**: Merchants não conseguem ver ou responder mensagens de clientes!

**O que NÃO EXISTE**:
- ❌ `/merchant/chat` - Chat com clientes
- ❌ `/merchant/messages` - Central de mensagens
- ❌ `/merchant/listings` - Gerenciar anúncios (só via mobile)

---

### 4. WEB - NÃO TEM CRIAR LISTING

**Problema**: No web-client não existe página para criar anúncios!

- Mobile tem: `CreateListingScreen.tsx` ✅
- Web NÃO tem: `/listings/create` ❌

**Impacto**: Usuários só podem criar anúncios pelo celular.

---

### 5. ADMIN SETTINGS - API NÃO IMPLEMENTADA

**Arquivo**: [web-client/src/app/admin/settings/page.tsx](web-client/src/app/admin/settings/page.tsx#L136-L151)

```typescript
// Fetch settings (mock for now)
...
// TODO: Implement API call
```

**Problema**: Configurações da plataforma são MOCKADAS, não salvam de verdade!

---

### 6. DRIVER HISTORY - DADOS FAKE

**Arquivo**: [web-client/src/app/driver/history/page.tsx](web-client/src/app/driver/history/page.tsx#L87-L88)

```typescript
// Mock data for demonstration
const mockDeliveries: DeliveryHistory[] = [...]
```

**Problema**: Histórico do entregador mostra dados falsos, não reais.

---

## 🟡 PROBLEMAS DE ACESSIBILIDADE (479 ERROS)

Múltiplas páginas com problemas de acessibilidade:

| Arquivo | Erros |
|---------|-------|
| `/admin/settings/page.tsx` | 16 erros (inputs sem label) |
| `/admin/coupons/page.tsx` | 6 erros |
| `/admin/platform-fees/page.tsx` | 4 erros |
| `/driver/profile/page.tsx` | 4 erros |
| `/driver/history/page.tsx` | 4 erros |
| Outros... | +445 erros |

---

## 🟡 DADOS MOCKADOS (PLACEHOLDER)

Páginas que mostram dados fake quando API não responde:

| Página | Problema |
|--------|----------|
| `/admin/merchants` | placeholderData com merchants fake |
| `/admin/orders` | placeholderData com pedidos fake |
| `/admin/users` | placeholderData com usuários fake |
| `/admin/payments` | placeholderData com pagamentos fake |
| `/admin/coupons` | placeholderData com cupons fake |
| `/admin/platform-fees` | placeholderData com taxas fake |
| `/admin/drivers` | placeholderData com drivers fake |
| `/merchant/dashboard` | placeholderData com stats fake |
| `/merchant/orders` | placeholderData com pedidos fake |
| `/merchant/products` | placeholderData com produtos fake |
| `/driver/history` | mockDeliveries (100% fake) |

---

## 📊 COMPARATIVO: VISÃO vs REALIDADE REAL

### PILAR 1: MARKETPLACE

| Feature | Visão | Código Existe | Funciona? |
|---------|-------|---------------|-----------|
| Listar anúncios | ✅ | ✅ | ✅ |
| Ver detalhes | ✅ | ✅ | ✅ |
| Criar anúncio (Web) | ✅ | ❌ | ❌ |
| Criar anúncio (Mobile) | ✅ | ✅ | ⚠️ Verificar |
| Contatar vendedor | ✅ | ❌ | ❌ BUGADO |
| Favoritar | ✅ | ✅ | ✅ |
| Admin moderar | ✅ | ❌ | ❌ |

**Status REAL**: **40%** (não **95%**)

---

### PILAR 2: CHAT

| Feature | Visão | Código Existe | Funciona? |
|---------|-------|---------------|-----------|
| Lista de conversas | ✅ | ✅ | ✅ |
| Enviar mensagens | ✅ | ✅ | ✅ |
| Chat no listing | ✅ | ❌ | ❌ BUGADO |
| Chat no merchant panel | ✅ | ❌ | ❌ |
| Chat no admin | ✅ | ❌ | ❌ |
| Notificações | ✅ | ✅ | ⚠️ Verificar |

**Status REAL**: **30%** (não **90%**)

---

### PILAR 3: ADMIN PANEL

| Feature | Visão | Código Existe | Funciona? |
|---------|-------|---------------|-----------|
| Dashboard | ✅ | ✅ | ✅ |
| Merchants | ✅ | ✅ | ✅ |
| Drivers | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Users | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ |
| Coupons | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ❌ MOCK |
| **Chat** | ✅ | ❌ | ❌ |
| **Listings** | ✅ | ❌ | ❌ |
| **Sponsors** | ✅ | ❌ | ❌ |
| **Feed** | ✅ | ❌ | ❌ |
| **Reports** | ✅ | ❌ | ❌ |

**Status REAL**: **60%** (não **90%**)

---

## 🛠️ AÇÕES NECESSÁRIAS (PRIORIDADE)

### ALTA PRIORIDADE (Bloqueantes)

1. **Integrar chat no listing detail** - Usuários não conseguem negociar
2. **Criar página `/listings/create` no web** - Só funciona no mobile
3. **Criar `/admin/listings`** - Admin não modera marketplace
4. **Criar `/merchant/chat`** - Merchants não veem mensagens
5. **Implementar API de settings** - Configurações não salvam

### MÉDIA PRIORIDADE

6. **Criar `/admin/sponsors`** - Gerenciar patrocinadores
7. **Criar `/admin/feed`** - Criar posts do feed
8. **Remover dados mockados** - Ou mostrar "carregando..."
9. **Corrigir histórico do driver** - Dados reais

### BAIXA PRIORIDADE

10. **Corrigir 479 erros de acessibilidade**
11. **Adicionar likes/comentários no feed**
12. **Criar `/admin/reports`**

---

## 📁 ARQUIVOS QUE PRECISAM SER CRIADOS

```
web-client/src/app/
├── listings/
│   └── create/
│       └── page.tsx          # ❌ NÃO EXISTE
├── admin/
│   ├── chat/
│   │   └── page.tsx          # ❌ NÃO EXISTE
│   ├── listings/
│   │   └── page.tsx          # ❌ NÃO EXISTE
│   ├── sponsors/
│   │   └── page.tsx          # ❌ NÃO EXISTE
│   ├── feed/
│   │   └── page.tsx          # ❌ NÃO EXISTE
│   └── reports/
│       └── page.tsx          # ❌ NÃO EXISTE
└── merchant/
    └── chat/
        └── page.tsx          # ❌ NÃO EXISTE
```

---

## 📁 ARQUIVOS QUE PRECISAM SER CORRIGIDOS

```
web-client/src/app/listings/[id]/page.tsx    # Linha 67-79: Chat bugado (alert instead of chat)
web-client/src/app/admin/settings/page.tsx   # Linha 136-151: API mock
web-client/src/app/driver/history/page.tsx   # Linha 87-155: Dados fake
mobile-client/src/screens/chat/ChatRoomScreen.tsx  # Não usa recipientId para criar conversa
backend/src/modules/chat/chat.controller.ts  # Falta endpoint find-or-create
```

---

## ✅ CONCLUSÃO REAL

O sistema está com aproximadamente **45-50%** de completude REAL considerando funcionalidades que:
1. Existem no código
2. Funcionam de verdade
3. Estão integradas entre si
4. Backend + Frontend conectados corretamente

### **BLOQUEIOS CRÍTICOS PARA PRODUÇÃO**:

| Bloqueio | Área | Severidade |
|----------|------|------------|
| Chat não inicia do listing (web) | Marketplace | 🔴 CRÍTICO |
| Chat não inicia do listing (mobile) | Marketplace | 🔴 CRÍTICO |
| Endpoint find-or-create não existe | Backend | 🔴 CRÍTICO |
| Admin não modera marketplace | Admin | 🟠 ALTO |
| Admin não gerencia sponsors | Admin | 🟠 ALTO |
| Merchant não vê mensagens | Merchant | 🟠 ALTO |
| Settings não persistem | Admin | 🟡 MÉDIO |
| Dados mockados em produção | Múltiplas | 🟡 MÉDIO |

### **O QUE REALMENTE FUNCIONA**:
- ✅ Listar restaurants e fazer pedidos
- ✅ Listar anúncios do marketplace (visualizar)
- ✅ Ver conversas existentes no chat
- ✅ Admin: gerenciar merchants, drivers, orders, users
- ✅ Merchant: dashboard, produtos, pedidos

### **O QUE NÃO FUNCIONA**:
- ❌ Iniciar chat sobre um anúncio (web e mobile)
- ❌ Criar anúncios pelo web
- ❌ Admin moderar marketplace
- ❌ Merchant responder clientes
- ❌ Salvar configurações do admin

### **AÇÃO IMEDIATA NECESSÁRIA**:
1. Corrigir integração do chat no listing (ambas plataformas)
2. Adicionar endpoint `/chat/conversations/find-or-create` no backend
3. Criar página de criar listing no web
4. Adicionar chat ao merchant panel

---

*Relatório de Auditoria Real - Super App*  
*Data: 18/03/2026*
