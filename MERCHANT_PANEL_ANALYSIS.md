# 🏪 Análise Completa do Painel Merchant

## 📊 Visão Geral

O painel merchant é uma das partes mais completas do sistema, com estrutura bem definida e funcionalidades principais implementadas. No entanto, existem diversas melhorias e funcionalidades faltantes para torná-lo **ultra profissional**.

---

## ✅ MÓDULOS EXISTENTES E FUNCIONAIS

### 1. 📈 Dashboard (`/merchant/dashboard`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Cards de estatísticas | ✅ | Pedidos hoje, receita, ticket médio |
| Pedidos em tempo real | ✅ | Pendentes, preparando, prontos |
| Gráfico de pedidos por horário | ✅ | Chart.js implementado |
| Gráfico de status dos pedidos | ✅ | Doughnut chart |
| Top produtos do dia | ✅ | Lista com vendas |
| Pedidos recentes | ✅ | Quick view |
| Filtro por período | ✅ | Hoje, semana, mês |

### 2. 📦 Pedidos (`/merchant/orders`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Lista de pedidos | ✅ | Paginado |
| Filtro por status | ✅ | Tabs por status |
| Aceitar pedido | ✅ | Com tempo estimado |
| Rejeitar pedido | ✅ | Com motivo |
| Marcar preparando | ✅ | Atualiza status |
| Marcar pronto | ✅ | Atualiza status |
| Detalhes do pedido | ✅ | Modal completo |
| Dados do cliente | ✅ | Nome, telefone, endereço |
| Dados do entregador | ✅ | Se atribuído |
| Atualização automática | ⚠️ | Polling 10s (não websocket) |

### 3. 🍕 Produtos (`/merchant/products`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Listar produtos | ✅ | Com categorias |
| Criar produto | ✅ | Modal completo |
| Editar produto | ✅ | Modal completo |
| Deletar produto | ✅ | Soft delete |
| Toggle disponibilidade | ✅ | Ativar/desativar |
| Busca por nome | ✅ | Filtro funcional |
| Filtro por categoria | ✅ | Dropdown |
| Imagem do produto | ⚠️ | Campo existe mas upload via URL |
| Preço promocional | ✅ | originalPrice |
| Tempo de preparo | ✅ | preparationTime |

### 4. 📁 Categorias (`/merchant/categories`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Listar categorias | ✅ | Com contagem de produtos |
| Criar categoria | ✅ | Nome e descrição |
| Editar categoria | ✅ | Modal |
| Deletar categoria | ✅ | Bloqueia se tem produtos |
| Toggle ativo | ✅ | Ativar/desativar |
| Ordenação | ⚠️ | sortOrder existe mas sem drag-drop |

### 5. 📊 Analytics (`/merchant/analytics`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Gráfico de faturamento | ✅ | Line chart |
| Gráfico de pedidos | ✅ | Bar chart |
| Pedidos por hora | ✅ | Horários de pico |
| Top produtos | ✅ | Receita e quantidade |
| Taxa de retenção | ✅ | Novos vs recorrentes |
| Filtro por período | ✅ | 7d, 30d, 90d |
| Exportar relatório | ❌ | **NÃO IMPLEMENTADO** |

### 6. ⭐ Avaliações (`/merchant/reviews`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Listar reviews | ✅ | Paginado |
| Filtro por nota | ✅ | 1-5 estrelas |
| Responder review | ✅ | Reply funcional |
| Rating médio | ✅ | Exibido |
| Distribuição de notas | ✅ | Gráfico |
| Reviews pendentes | ✅ | Contador |

### 7. 🔐 Login (`/merchant/login`)
**Status: ✅ Funcional**

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Login email/senha | ✅ | Funcional |
| OAuth Google | ⚠️ | Precisa configurar |
| OAuth Apple | ⚠️ | Precisa configurar |
| OAuth Facebook | ⚠️ | Precisa configurar |
| Recuperar senha | ❌ | Link faltando |

---

## ❌ FUNCIONALIDADES FALTANTES (CRÍTICAS)

### 1. ⚙️ Configurações (`/merchant/settings`) - **NÃO EXISTE**
Esta é a funcionalidade **mais crítica faltando**. O link existe no menu mas a página não foi criada.

**Necessário implementar:**
- ✏️ Editar informações do estabelecimento (nome, descrição)
- 🖼️ Upload de logo
- 🎨 Upload de banner
- 📍 Editar endereço
- 💰 Configurar taxa de entrega
- 💵 Configurar pedido mínimo
- ⏱️ Configurar tempo estimado de entrega
- 📱 Editar telefone/contato
- 🔔 Configurações de notificação

### 2. 🕐 Horário de Funcionamento - **PARCIALMENTE IMPLEMENTADO**
O schema do frontend tem `openingHours` mas:
- ❌ Não existe UI para configurar
- ❌ Backend não salva horários no banco
- ❌ Prisma schema não tem tabela de horários

### 3. 🎫 Cupons de Desconto - **EXISTE MAS NÃO INTEGRADO**
O backend tem módulo de cupons (`/api/v1/coupons`) mas:
- ❌ Não existe página no painel merchant
- ❌ Merchant não consegue criar/gerenciar cupons
- ⚠️ API permite mas sem UI

### 4. 📸 Upload de Imagens - **INFRAESTRUTURA EXISTE, UI FALTA**
O `uploadService` está implementado mas:
- ❌ Produtos: Campo URL ao invés de upload
- ❌ Logo/Banner: Sem UI para trocar
- ❌ Categorias: Sem imagem

### 5. 📧 Recuperação de Senha - **SEM LINK NO LOGIN**
O sistema tem recuperação de senha mas:
- ❌ Página de login não tem link "Esqueci minha senha"

### 6. 🔔 Notificações Push - **NÃO IMPLEMENTADO**
- ❌ Merchant não recebe notificação de novo pedido
- ❌ Sem configuração de sons/alertas
- ❌ Sem integração com FCM/OneSignal

### 7. 📄 Relatórios Exportáveis - **NÃO IMPLEMENTADO**
- ❌ Exportar pedidos para CSV/Excel
- ❌ Exportar analytics para PDF
- ❌ Relatório fiscal

### 8. 🔄 WebSocket para Pedidos - **USANDO POLLING**
- ⚠️ Atualmente usa polling de 10 segundos
- ❌ Deveria usar WebSocket para real-time

---

## 🔧 MELHORIAS SUGERIDAS

### UX/UI
1. **Drag-and-drop** para ordenar categorias e produtos
2. **Notificação sonora** quando novo pedido chega
3. **Modo escuro** para uso noturno
4. **Impressão de comandas** direta do sistema
5. **Atalhos de teclado** para ações rápidas

### Funcionalidades
1. **Pausar estabelecimento** temporariamente (diferente de fechar)
2. **Cardápio digital** com QR code para clientes
3. **Histórico de alterações** nos produtos
4. **Clonagem de produtos** para criar variações
5. **Promoções por tempo** (happy hour)
6. **Estoque** com alertas de baixo estoque
7. **Múltiplos usuários** por merchant (funcionários)
8. **Integração com iFood/Rappi** (importar cardápio)

### Analytics Avançados
1. **Previsão de demanda** baseada em histórico
2. **Análise de cancelamentos** por motivo
3. **Ticket médio por horário** 
4. **Comparativo semanal/mensal**
5. **ROI de promoções**

---

## 📋 PLANO DE IMPLEMENTAÇÃO PRIORITÁRIO

### Fase 1: Crítico (1-2 semanas)
1. [x] Criar página `/merchant/settings`
2. [x] Implementar upload de logo/banner
3. [x] Adicionar link "Esqueci senha" no login
4. [x] Criar página de gestão de cupons

### Fase 2: Importante (2-3 semanas)
1. [ ] Implementar horário de funcionamento
2. [ ] Notificações push para novos pedidos
3. [ ] Migrar polling para WebSocket
4. [ ] Upload de imagens nos produtos

### Fase 3: Melhorias (3-4 semanas)
1. [ ] Exportar relatórios (Excel/PDF)
2. [ ] Drag-and-drop para ordenação
3. [ ] Som de novo pedido
4. [ ] Sistema de impressão

---

## 📁 ESTRUTURA DE ARQUIVOS ATUAL

```
web-client/src/app/merchant/
├── layout.tsx          ✅ Layout completo
├── login/page.tsx      ✅ Login funcional
├── dashboard/page.tsx  ✅ Dashboard completo
├── orders/page.tsx     ✅ Gestão de pedidos
├── products/page.tsx   ✅ Gestão de produtos
├── categories/page.tsx ✅ Gestão de categorias
├── analytics/page.tsx  ✅ Analytics
├── reviews/page.tsx    ✅ Avaliações
├── settings/           ❌ NÃO EXISTE
├── coupons/            ❌ NÃO EXISTE
└── [id]/page.tsx       ✅ Página pública do merchant
```

---

## 🎯 CONCLUSÃO

O painel merchant está **80% funcional** para operação básica. As principais lacunas são:

1. **Página de Configurações** - Impossível editar dados do estabelecimento
2. **Cupons de Desconto** - Módulo existe mas sem UI
3. **Horário de Funcionamento** - Não configurável
4. **Notificações Push** - Essencial para operação
5. **Upload de Imagens** - Infraestrutura existe mas sem integração

A boa notícia é que o **backend já suporta** a maioria das funcionalidades - falta apenas criar as interfaces no frontend.

---

*Relatório gerado em: 18 de março de 2026*
