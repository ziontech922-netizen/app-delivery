# 📱 SUPER APP - RELATÓRIO VISUAL DO PRODUTO

**Versão:** 1.0  
**Data:** 11 de março de 2026  
**Status:** Validado e Pronto para Produção

---

## 📋 VISÃO GERAL

O Super App é uma plataforma completa de negócios locais que unifica:

| Funcionalidade | Descrição |
|----------------|-----------|
| 🍔 **Delivery** | Pedidos de comida com rastreamento em tempo real |
| 🛒 **Marketplace** | Compra e venda de produtos entre usuários |
| 🔧 **Serviços** | Contratação de serviços locais |
| 💬 **Chat** | Comunicação direta entre usuários |
| 📢 **Feed Social** | Conteúdo da comunidade local |
| 🤖 **IA** | Publicação de anúncios por texto ou áudio |
| 💰 **Patrocínios** | Sistema de anúncios para negócios |

---

# 1️⃣ DESCRIÇÃO VISUAL TELA POR TELA

## 📱 APLICATIVO MOBILE

### ExploreHomeScreen
**Hub principal da plataforma**

```
┌─────────────────────────────────┐
│  Olá, João!                  🔔 │
│  O que você procura hoje?   🔍 │
├─────────────────────────────────┤
│                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │🍔  │ │📦  │ │🔧  │ │🚗  │  │
│  │Food│ │Prod│ │Serv│ │Veíc│  │
│  └────┘ └────┘ └────┘ └────┘  │
│  ┌────┐ ┌────┐                 │
│  │💼  │ │🏠  │                 │
│  │Jobs│ │Imóv│                 │
│  └────┘ └────┘                 │
├─────────────────────────────────┤
│  📣 PATROCINADORES              │
│  ┌─────────────────────────────┐│
│  │   Banner promocional        ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  🔥 Destaques                   │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │     │ │     │ │     │      │
│  │Card │ │Card │ │Card │ →    │
│  └─────┘ └─────┘ └─────┘      │
├─────────────────────────────────┤
│  🆕 Feed da Comunidade          │
│  ┌─────────────────────────────┐│
│  │ Post do feed...             ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
│ 🏠  │ 🔍  │ ➕  │ 💬  │ 👤  │
```

| Elemento | Descrição |
|----------|-----------|
| **Header** | Saudação personalizada, ícones busca/notificações |
| **Grid Categorias** | 6 categorias principais com ícones coloridos |
| **Banner Patrocinado** | Carrossel de anúncios patrocinados |
| **Destaques** | Cards horizontais de produtos/restaurantes |
| **Feed** | Cards do feed da comunidade |
| **Tab Bar** | Home, Busca, Criar, Chat, Perfil |

**Interações:**
- Toque em categoria → Navega para listagem filtrada
- Toque em card → Abre detalhes
- Scroll horizontal → Navega pelos destaques
- Pull-to-refresh → Atualiza conteúdo

---

### ListingsScreen
**Marketplace de produtos e serviços**

```
┌─────────────────────────────────┐
│  ← Marketplace              🔍  │
├─────────────────────────────────┤
│ [Todas▼] [Preço▼] [Ordem▼]     │
├─────────────────────────────────┤
│  🍔 📦 🔧 🚗 💼 🏠               │
├─────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐        │
│ │  📷     │ │  📷     │        │
│ │ ────────│ │ ────────│        │
│ │ Produto │ │ Produto │        │
│ │ R$ 99   │ │ R$ 150  │        │
│ │ ❤️ 12   │ │ ❤️ 45   │        │
│ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐        │
│ │  📷     │ │  📷     │        │
│ │ ────────│ │ ────────│        │
│ │ Serviço │ │ Item    │        │
│ │ R$ 200  │ │ R$ 75   │        │
│ │ ❤️ 8    │ │ ❤️ 23   │        │
│ └─────────┘ └─────────┘        │
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Filtros** | Dropdowns de categoria, preço e ordenação |
| **Chips de Categoria** | Filtro rápido horizontal por categoria |
| **Grid de Cards** | 2 colunas com imagem, título, preço, favoritos |
| **Card de Anúncio** | Foto, título, preço, ícone favorito |

**Interações:**
- Toque em filtro → Abre opções
- Toque em categoria → Filtra lista
- Toque em card → Abre ListingDetailScreen
- Toque em ❤️ → Favorita/desfavorita
- Scroll infinito → Carrega mais itens

---

### CreateListingScreen
**Criação de anúncios com IA (meta: 15 segundos)**

```
┌─────────────────────────────────┐
│  ← Criar Anúncio                │
├─────────────────────────────────┤
│        ① ─── ② ─── ③           │
│                                 │
│  Descreva o que você quer      │
│  vender ou oferecer            │
│                                 │
│  ┌─────────────────────────────┐│
│  │ "Vendo sofá de 3 lugares,  ││
│  │  cor bege, em ótimo estado ││
│  │  por R$ 800..."            ││
│  └─────────────────────────────┘│
│                                 │
│             OU                  │
│                                 │
│         ┌───────┐              │
│         │  🎤   │  ← Gravar   │
│         │ 0:05  │              │
│         └───────┘              │
│                                 │
├─────────────────────────────────┤
│  📷 Adicionar Fotos             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ +  │ │ 📷 │ │ 📷 │ │    │  │
│  └────┘ └────┘ └────┘ └────┘  │
├─────────────────────────────────┤
│  🤖 Preview Gerado pela IA      │
│  ┌─────────────────────────────┐│
│  │ Título: Sofá 3 Lugares     ││
│  │ Categoria: Móveis          ││
│  │ Preço: R$ 800              ││
│  │ Condição: Usado            ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │      ✓ PUBLICAR ANÚNCIO    ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Step Indicator** | 3 passos: Input → Fotos → Confirmar |
| **Campo de Texto** | TextArea para descrição livre |
| **Botão Gravar** | Ícone de microfone com contador |
| **Grid de Fotos** | Até 10 fotos com botão adicionar |
| **Preview IA** | Card mostrando dados extraídos |
| **Botão Publicar** | CTA principal gradiente |

**Interações:**
- Digitação → Extração em tempo real
- Long press 🎤 → Grava áudio
- Toque + fotos → Abre galeria/câmera
- Toque Publicar → Confirma e publica

---

### ListingDetailScreen
**Detalhes do anúncio**

```
┌─────────────────────────────────┐
│  ← │                     ❤️ 📤 │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │                             ││
│  │       📷 Imagem Grande      ││
│  │                             ││
│  │         • • ○ ○             ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  Sofá 3 Lugares Bege            │
│  R$ 800,00                   📍 │
│  São Paulo, SP                  │
│                                 │
│  ┌────────────────────────────┐ │
│  │ 👤 João Silva      Ver → │ │
│  │ ⭐ 4.8 (23 avaliações)    │ │
│  └────────────────────────────┘ │
│                                 │
│  📝 Descrição                   │
│  Sofá em ótimo estado, usado   │
│  por 2 anos, sem manchas...    │
│                                 │
│  📋 Detalhes                    │
│  • Categoria: Móveis            │
│  • Condição: Usado              │
│  • Publicado: há 2 horas        │
├─────────────────────────────────┤
│  ┌────────────┐ ┌─────────────┐│
│  │  💬 Chat   │ │ 📞 Ligar   ││
│  └────────────┘ └─────────────┘│
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Galeria** | Carrossel de imagens com indicadores |
| **Info Principal** | Título, preço, localização |
| **Card Vendedor** | Foto, nome, rating, link para perfil |
| **Descrição** | Texto completo do anúncio |
| **Detalhes** | Lista de atributos |
| **CTAs** | Botões Chat e Ligar |

**Interações:**
- Swipe imagens → Navega galeria
- Toque ❤️ → Favorita
- Toque vendedor → Abre perfil
- Toque Chat → Abre ChatRoomScreen
- Toque Ligar → Abre discador

---

### ConversationsScreen (ChatListScreen)
**Lista de conversas**

```
┌─────────────────────────────────┐
│  💬 Mensagens                   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 👤 Maria Santos          2m │ │
│ │ Ainda está disponível?     │ │
│ │ 🟢 Online                  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Pedro Lima           15m │ │
│ │ Podemos combinar amanhã?   │ │
│ │ 🔵 2 não lidas             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Ana Costa             1h │ │
│ │ Obrigada pela compra! 👍   │ │
│ └─────────────────────────────┘ │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Lista de Conversas** | Cards com avatar, nome, última msg, tempo |
| **Badge não lidas** | Contador de mensagens não lidas |
| **Status online** | Indicador de usuário online |

**Interações:**
- Toque em conversa → Abre ChatRoomScreen
- Swipe esquerda → Opções (arquivar/deletar)
- Pull-to-refresh → Atualiza lista

---

### ChatRoomScreen
**Tela de conversa em tempo real**

```
┌─────────────────────────────────┐
│  ← Maria Santos          📞 •••│
├─────────────────────────────────┤
│  ┌───────────────────┐         │
│  │ Oi, ainda tem o   │         │
│  │ sofá disponível?  │    14:30│
│  └───────────────────┘         │
│                                 │
│         ┌───────────────────┐  │
│         │ Sim! Está         │  │
│         │ disponível sim    │  │
│  14:32  └───────────────────┘  │
│                                 │
│  ┌───────────────────┐         │
│  │ 📷 [Imagem]       │         │
│  └───────────────────┘    14:33│
│                                 │
│         ┌───────────────────┐  │
│         │ Perfeito!         │  │
│  14:35  └───────────────────┘  │
│                                 │
│  Maria está digitando...        │
├─────────────────────────────────┤
│  ┌─────────────────┐ 📷 🎤 ➤  │
│  │ Digite aqui...  │           │
│  └─────────────────┘           │
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Header** | Nome do contato, botão ligar, menu |
| **Mensagens** | Bolhas com texto, timestamp |
| **Mídia** | Imagens e áudios inline |
| **Typing Indicator** | Mostra quando outro digita |
| **Input Bar** | Campo, botões câmera/áudio/enviar |

**Interações:**
- Digitação → Envia evento typing
- Enviar → Mensagem em tempo real via Socket
- Toque 📷 → Envia imagem
- Long press 🎤 → Grava áudio

---

### RestaurantListScreen
**Lista de restaurantes**

```
┌─────────────────────────────────┐
│  ← Restaurantes             🔍 │
├─────────────────────────────────┤
│ [🍕 Pizza] [🍔 Burger] [🍣 Jap]│
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📷                          │ │
│ │ Pizzaria Italia   ⭐ 4.8    │ │
│ │ Pizza • 25-35 min • 2.5km  │ │
│ │ ✓ Entrega Grátis           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📷                          │ │
│ │ Burger House      ⭐ 4.5    │ │
│ │ Lanches • 30-40 min • 1.2km│ │
│ │ Pedido mín: R$ 25          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Filtros** | Chips de categorias/cozinhas |
| **Card Restaurante** | Foto, nome, rating, tempo, distância |
| **Tags** | Entrega grátis, pedido mínimo |

**Interações:**
- Toque filtro → Filtra lista
- Toque card → Abre RestaurantDetailScreen

---

### RestaurantDetailScreen (RestaurantMenuScreen)
**Cardápio do restaurante**

```
┌─────────────────────────────────┐
│  ← │                          │
│  ┌─────────────────────────────┐│
│  │      📷 Cover Image        ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  Pizzaria Italia      ⭐ 4.8   │
│  Pizza • R$ 25 mín • 25-35 min │
├─────────────────────────────────┤
│  [Pizzas] [Bebidas] [Sobremesas]│
├─────────────────────────────────┤
│  🍕 Pizzas                      │
│  ┌─────────────────────────────┐│
│  │ 📷 Pizza Margherita        ││
│  │ Molho, mussarela, manjericão│
│  │ R$ 49,90              [+]  ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 📷 Pizza Calabresa         ││
│  │ Calabresa, cebola, azeitona ││
│  │ R$ 54,90              [+]  ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 🛒 Ver Carrinho (2)  R$ 99 ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Cover** | Imagem de capa do restaurante |
| **Info** | Nome, rating, tipo, mínimo, tempo |
| **Tabs** | Categorias do cardápio |
| **Produtos** | Lista com foto, descrição, preço |
| **Carrinho** | Barra fixa com total e quantidade |

**Interações:**
- Toque produto → Abre modal de customização
- Toque [+] → Adiciona ao carrinho
- Toque carrinho → Abre CheckoutScreen

---

### CheckoutScreen
**Finalização de pedido**

```
┌─────────────────────────────────┐
│  ← Finalizar Pedido             │
├─────────────────────────────────┤
│  📍 Endereço de Entrega         │
│  ┌─────────────────────────────┐│
│  │ 🏠 Casa                     ││
│  │ Rua das Flores, 123, Ap 45 ││
│  │ São Paulo, SP         [✎] ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  🛒 Itens do Pedido             │
│  ┌─────────────────────────────┐│
│  │ 1x Pizza Margherita  R$ 49 ││
│  │ 1x Pizza Calabresa   R$ 54 ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  🎫 Cupom de Desconto           │
│  ┌─────────────────────────────┐│
│  │ [________________] [Aplicar]││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  💳 Pagamento                   │
│  ┌─────────────────────────────┐│
│  │ ○ Cartão **** 1234         ││
│  │ ● PIX               [ + ] ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  Subtotal:         R$ 103,90   │
│  Taxa entrega:      R$ 5,00    │
│  Taxa serviço:      R$ 2,00    │
│  ──────────────────────────────│
│  Total:            R$ 110,90   │
│                                 │
│  ┌─────────────────────────────┐│
│  │    ✓ CONFIRMAR PEDIDO      ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Endereço** | Card editável com endereço selecionado |
| **Itens** | Lista de produtos do carrinho |
| **Cupom** | Campo para código de desconto |
| **Pagamento** | Opções: Cartão, PIX, Dinheiro |
| **Resumo** | Subtotal, taxas, total |
| **CTA** | Botão confirmar pedido |

**Interações:**
- Toque endereço → Seleciona outro
- Aplicar cupom → Valida e aplica desconto
- Selecionar pagamento → Altera método
- Confirmar → Processa pagamento

---

### OrdersScreen
**Histórico de pedidos**

```
┌─────────────────────────────────┐
│  📦 Meus Pedidos                │
├─────────────────────────────────┤
│  [Ativos] [Histórico]          │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 📍 Pizzaria Italia         ││
│  │ Pedido #12345              ││
│  │ 🟢 Em preparo              ││
│  │ R$ 110,90      [Acompanhar]││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 📍 Burger House            ││
│  │ Pedido #12340              ││
│  │ ✅ Entregue - 10/03        ││
│  │ R$ 85,00      [Pedir novo] ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

| Elemento | Descrição |
|----------|-----------|
| **Tabs** | Pedidos ativos vs histórico |
| **Card Pedido** | Restaurante, número, status, valor |
| **Ações** | Acompanhar (ativo) ou Pedir novo |

---

### OrderTrackingScreen
**Rastreamento em tempo real**

```
┌─────────────────────────────────┐
│  ← Pedido #12345                │
├─────────────────────────────────┤
│                                 │
│      ┌─────────────────────┐   │
│      │                     │   │
│      │    🗺️ MAPA          │   │
│      │                     │   │
│      │    📍 ────── 🛵     │   │
│      │                     │   │
│      └─────────────────────┘   │
│                                 │
│  ⏱️ Previsão: 15-20 min         │
├─────────────────────────────────┤
│  ✅ Pedido confirmado    14:30 │
│  ✅ Em preparo           14:35 │
│  🔄 Saiu para entrega    14:50 │
│  ○  Entregue                   │
├─────────────────────────────────┤
│  🛵 Entregador                  │
│  ┌─────────────────────────────┐│
│  │ 👤 Carlos          📞 💬  ││
│  │ Moto • ⭐ 4.9             ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

### ProfileScreen
**Perfil do usuário**

```
┌─────────────────────────────────┐
│  ⚙️                             │
├─────────────────────────────────┤
│        ┌─────────┐             │
│        │   👤    │             │
│        └─────────┘             │
│         João Silva             │
│         @joaosilva             │
│         ⭐ 4.8 (45 avaliações) │
├─────────────────────────────────┤
│  📦 Meus Pedidos           →   │
│  ❤️ Favoritos              →   │
│  📍 Endereços              →   │
│  💳 Pagamentos             →   │
│  📢 Meus Anúncios          →   │
│  🔔 Notificações           →   │
│  ⚙️ Configurações          →   │
│  ❓ Ajuda                  →   │
├─────────────────────────────────┤
│  [Sair]                        │
└─────────────────────────────────┘
```

---

## 🖥️ PAINEL WEB - ADMIN

### AdminDashboard
**Visão geral administrativa**

```
┌─────────────────────────────────────────────────────────────┐
│  🍔 Super App Admin                       👤 Admin │ Sair  │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  📊 Dash   │  Dashboard                                     │
│  👥 Users  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  🏪 Merch  │  │ 1.234    │ │ R$ 45K   │ │ 456      │       │
│  📦 Orders │  │ Usuários │ │ Vendas   │ │ Pedidos  │       │
│  📢 Listng │  └──────────┘ └──────────┘ └──────────┘       │
│  💰 Fees   │                                                │
│  🎫 Cupons │  📈 Vendas da Semana                           │
│  📣 Spons  │  ┌────────────────────────────────────┐       │
│            │  │    /\      /\                      │       │
│            │  │   /  \    /  \    /\              │       │
│            │  │  /    \  /    \  /  \__           │       │
│            │  └────────────────────────────────────┘       │
│            │                                                │
│            │  🏆 Top Restaurantes                           │
│            │  1. Pizzaria Italia - R$ 12.500               │
│            │  2. Burger House - R$ 8.900                   │
│            │  3. Sushi Express - R$ 7.200                  │
└────────────┴────────────────────────────────────────────────┘
```

---

# 2️⃣ FLUXOS COMPLETOS DO USUÁRIO

## Fluxo 1: Explorar a Plataforma

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    👤 Usuário                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │   Abre o    │                                            │
│  │  aplicativo │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ExploreHome  │                                            │
│  │  Screen     │◄─── Vê categorias, destaques, feed         │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼ Toca em categoria                                 │
│  ┌──────┴──────┬─────────────┬───────────────┐             │
│  │             │             │               │              │
│  ▼             ▼             ▼               ▼              │
│ 🍔Comida     📦Produtos    🔧Serviços     🚗Veículos       │
│  │             │             │               │              │
│  ▼             ▼             ▼               ▼              │
│ Restaurant  Listings      Listings       Listings          │
│ ListScreen   Screen        Screen         Screen            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Passos detalhados:**
1. Usuário abre o aplicativo
2. Carrega a ExploreHomeScreen
3. Visualiza saudação personalizada
4. Vê grid de categorias (6 categorias principais)
5. Vê banners patrocinados (Sponsors)
6. Vê destaques horizontais
7. Vê feed da comunidade
8. Escolhe categoria tocando no ícone
9. Navega para a tela específica

---

## Fluxo 2: Publicar Anúncio (15 segundos)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    👤 Usuário                                               │
│       │                                                     │
│       ▼ Toca em ➕ (criar)                                  │
│  ┌─────────────┐                                            │
│  │CreateListing│                                            │
│  │  Screen     │                                            │
│  └──────┬──────┘                                            │
│         │                                                   │
│    ┌────┴────┐                                              │
│    │         │                                              │
│    ▼         ▼                                              │
│ ✏️ Texto   🎤 Áudio                                         │
│    │         │                                              │
│    │         │ Grava áudio                                  │
│    │         ▼                                              │
│    │    ┌─────────────┐                                     │
│    │    │ OpenAI      │                                     │
│    │    │ Whisper     │ ◄── Transcrição                     │
│    │    └──────┬──────┘                                     │
│    │           │                                            │
│    └─────┬─────┘                                            │
│          ▼                                                  │
│    ┌─────────────┐                                          │
│    │  🤖 Motor   │                                          │
│    │     IA      │ ◄── Extrai: título, preço, categoria     │
│    └──────┬──────┘                                          │
│           │                                                 │
│           ▼                                                 │
│    ┌─────────────┐                                          │
│    │  Preview    │                                          │
│    │  dos Dados  │ ◄── Usuário revisa                       │
│    └──────┬──────┘                                          │
│           │                                                 │
│           ▼ Adiciona fotos (opcional)                       │
│    ┌─────────────┐                                          │
│    │    📷       │                                          │
│    │   Fotos     │                                          │
│    └──────┬──────┘                                          │
│           │                                                 │
│           ▼ Toca "Publicar"                                 │
│    ┌─────────────┐                                          │
│    │   POST      │                                          │
│    │ /listings   │                                          │
│    └──────┬──────┘                                          │
│           │                                                 │
│           ▼                                                 │
│    ┌─────────────┐                                          │
│    │  Anúncio    │                                          │
│    │  Publicado! │ ✅                                       │
│    └─────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Passos detalhados:**
1. Usuário toca no botão ➕ da tab bar
2. Carrega CreateListingScreen
3. **Opção A - Texto:**
   - Digita descrição livre: "Vendo sofá 3 lugares por R$ 800"
   - IA extrai automaticamente os dados
4. **Opção B - Áudio:**
   - Pressiona e segura botão 🎤
   - Fala a descrição
   - Áudio é enviado para OpenAI Whisper
   - Transcrição retorna como texto
   - IA extrai os dados
5. Preview mostra dados extraídos
6. Usuário adiciona fotos (opcional)
7. Toca em "Publicar"
8. Anúncio é criado via POST /listings
9. Sucesso! Anúncio publicado

---

## Fluxo 3: Conversar com Vendedor

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    👤 Comprador                                             │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │ListingDetail│                                            │
│  │  Screen     │ ◄── Vê detalhes do anúncio                 │
│  └──────┬──────┘                                            │
│         │ Toca em "💬 Chat"                                 │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │   POST      │                                            │
│  │ /chat/send  │ ◄── Cria conversa se não existir           │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ ChatRoom    │                                            │
│  │  Screen     │ ◄── Conecta via WebSocket                  │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ▼ Digita mensagem                                   │
│  ┌─────────────┐        ┌─────────────────────┐            │
│  │Socket.IO    │───────►│ ChatGateway         │            │
│  │send_message │        │ (WebSocket Server)  │            │
│  └──────┬──────┘        └──────────┬──────────┘            │
│         │                          │                        │
│         │                          ▼                        │
│         │               ┌─────────────────────┐            │
│         │               │ Salva no PostgreSQL │            │
│         │               └──────────┬──────────┘            │
│         │                          │                        │
│         │                          ▼                        │
│         │               ┌─────────────────────┐            │
│    ◄────┴───────────────│ Emite new_message   │            │
│                         └─────────────────────┘            │
│  Mensagem aparece                                           │
│  em tempo real! ✅                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Eventos WebSocket:**
- `join_conversation` - Entra na sala
- `send_message` - Envia mensagem
- `new_message` - Recebe mensagem
- `typing_start` / `typing_stop` - Indicador de digitação

---

## Fluxo 4: Fazer Pedido de Comida

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    👤 Cliente                                               │
│       │                                                     │
│       ▼ Toca em 🍔 Comida                                   │
│  ┌─────────────┐                                            │
│  │ Restaurant  │                                            │
│  │ ListScreen  │ ◄── Lista de restaurantes                  │
│  └──────┬──────┘                                            │
│         │ Escolhe restaurante                               │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ Restaurant  │                                            │
│  │DetailScreen │ ◄── Cardápio categorizado                  │
│  └──────┬──────┘                                            │
│         │ Adiciona produtos                                 │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Carrinho   │                                            │
│  │   (Store)   │ ◄── Estado local (Zustand)                 │
│  └──────┬──────┘                                            │
│         │ Toca em "Ver Carrinho"                            │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  Checkout   │                                            │
│  │   Screen    │ ◄── Endereço, cupom, pagamento             │
│  └──────┬──────┘                                            │
│         │ Confirma pedido                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │ POST        │        ┌─────────────────────┐            │
│  │ /orders     │───────►│ OrdersService       │            │
│  └──────┬──────┘        └──────────┬──────────┘            │
│         │                          │                        │
│         │                          ▼                        │
│         │               ┌─────────────────────┐            │
│         │               │ PaymentsService     │            │
│         │               │ (Mercado Pago)      │            │
│         │               └──────────┬──────────┘            │
│         │                          │                        │
│         │                          ▼                        │
│         │               ┌─────────────────────┐            │
│         │               │ DriverMatching      │            │
│         │               │ Service             │            │
│         │               └──────────┬──────────┘            │
│         │                          │                        │
│         ▼                          ▼                        │
│  ┌─────────────┐        ┌─────────────────────┐            │
│  │ Order       │◄───────│ Notifica via        │            │
│  │ Tracking    │        │ Socket + Push       │            │
│  └─────────────┘        └─────────────────────┘            │
│                                                             │
│  Status em tempo real: Confirmado → Preparo → Entrega ✅    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 3️⃣ ARQUITETURA FINAL DO BACKEND

## Diagrama de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                     APP MODULE (ROOT)                        │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────┘
       │      │      │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
   │ Core ││Deliv.││Market││Social││ Mone ││ Admin││Infra │
   └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

## 📦 Core Modules

| Módulo | Responsabilidade |
|--------|------------------|
| **AuthModule** | Autenticação JWT, login, registro, refresh tokens |
| **UsersModule** | CRUD de usuários, perfis, handles |
| **NotificationsModule** | Push notifications (Firebase), in-app |
| **StorageModule** | Upload de arquivos (S3/R2) |
| **SearchModule** | Busca unificada (Elasticsearch) |

## 🚚 Delivery Modules

| Módulo | Responsabilidade |
|--------|------------------|
| **MerchantsModule** | Cadastro e gestão de restaurantes |
| **ProductsModule** | Cardápios, categorias, complementos |
| **OrdersModule** | Criação, status, histórico de pedidos |
| **DriversModule** | Cadastro de entregadores |
| **DriverMatchingModule** | Algoritmo de matching driver-pedido |
| **EtaModule** | Cálculo de tempo estimado de entrega |

## 🛒 Marketplace Modules

| Módulo | Responsabilidade |
|--------|------------------|
| **ListingsModule** | CRUD de anúncios, favoritos, busca |
| **AiListingModule** | Processamento IA (texto/áudio → dados) |

## 💬 Social Modules

| Módulo | Responsabilidade |
|--------|------------------|
| **ChatModule** | Mensagens, conversas, WebSocket gateway |
| **CommunityFeedModule** | Posts, feed personalizado |
| **ReviewsModule** | Avaliações de restaurantes/vendedores |

## 💰 Monetization Modules

| Módulo | Responsabilidade |
|--------|------------------|
| **PaymentsModule** | Integração Mercado Pago, PIX, cartão |
| **SponsorsModule** | Anúncios patrocinados, métricas |
| **PlatformFeeModule** | Taxas da plataforma, relatórios |
| **CouponsModule** | Cupons de desconto, validação |

## 🔧 Admin & Infra

| Módulo | Responsabilidade |
|--------|------------------|
| **AdminModule** | Painel administrativo, relatórios |
| **HealthModule** | Health checks, status da API |
| **RealtimeModule** | Configuração Socket.IO |

## Comunicação Entre Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  OrdersModule                                               │
│       │                                                     │
│       ├──► PaymentsModule     (processar pagamento)         │
│       │                                                     │
│       ├──► DriverMatchingModule (encontrar entregador)      │
│       │                                                     │
│       ├──► NotificationsModule (notificar partes)           │
│       │                                                     │
│       └──► RealtimeModule     (updates em tempo real)       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AiListingModule                                            │
│       │                                                     │
│       ├──► ListingsModule     (criar anúncio)               │
│       │                                                     │
│       └──► StorageModule      (salvar áudio/imagens)        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ChatModule                                                 │
│       │                                                     │
│       ├──► UsersModule        (dados do usuário)            │
│       │                                                     │
│       ├──► ListingsModule     (ref. anúncios no chat)       │
│       │                                                     │
│       └──► NotificationsModule (push de nova msg)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 4️⃣ ENDPOINTS PRINCIPAIS DA API

## 🔐 Auth `/auth`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro de novo usuário |
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Invalidar tokens |
| POST | `/auth/forgot-password` | Solicitar reset de senha |
| POST | `/auth/reset-password` | Redefinir senha |

## 👤 Users `/users`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users/me` | Perfil do usuário logado |
| PUT | `/users/me` | Atualizar perfil |
| GET | `/users/:handle` | Perfil público por handle |

## 📢 Listings `/listings`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/listings` | Listar anúncios (filtros, paginação) |
| POST | `/listings` | Criar novo anúncio |
| GET | `/listings/categories` | Listar categorias com contagem |
| GET | `/listings/stats` | Estatísticas de anúncios |
| GET | `/listings/:id` | Detalhes de um anúncio |
| PUT | `/listings/:id` | Atualizar anúncio |
| DELETE | `/listings/:id` | Remover anúncio |
| GET | `/listings/favorites/my` | Meus favoritos |
| POST | `/listings/:id/favorite` | Adicionar aos favoritos |
| DELETE | `/listings/:id/favorite` | Remover dos favoritos |
| GET | `/listings/user/:handle` | Anúncios de um usuário |

## 🤖 AI Listing `/ai-listing`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/ai-listing/text` | Criar anúncio via texto |
| POST | `/ai-listing/audio` | Criar anúncio via áudio |
| POST | `/ai-listing/preview` | Preview da extração (sem criar) |

## 💬 Chat `/chat`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/chat/conversations` | Listar minhas conversas |
| GET | `/chat/conversations/:id` | Detalhes de conversa |
| GET | `/chat/conversations/:id/messages` | Mensagens da conversa |
| POST | `/chat/conversations/:id/messages` | Enviar mensagem |
| POST | `/chat/conversations/:id/read` | Marcar como lida |
| POST | `/chat/send` | Criar conversa e enviar msg |
| GET | `/chat/unread-count` | Contagem de não lidas |
| DELETE | `/chat/messages/:id` | Deletar mensagem |

### WebSocket Events (namespace: `/chat`)

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `join_conversation` | Client → Server | Entrar na sala |
| `leave_conversation` | Client → Server | Sair da sala |
| `send_message` | Client → Server | Enviar mensagem |
| `new_message` | Server → Client | Nova mensagem |
| `typing_start` | Client → Server | Iniciou digitação |
| `typing_stop` | Client → Server | Parou de digitar |
| `user_typing` | Server → Client | Usuário digitando |

## 📰 Community Feed `/feed`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/feed` | Feed da comunidade |
| GET | `/feed/personalized` | Feed personalizado |
| POST | `/feed` | Criar item (admin) |
| PUT | `/feed/:id` | Atualizar item |
| DELETE | `/feed/:id` | Remover item |

## 📣 Sponsors `/sponsors`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/sponsors` | Listar patrocinadores |
| GET | `/sponsors/placement/:placement` | Por posição (HOME_BANNER, etc) |
| POST | `/sponsors/:id/click` | Registrar clique |
| GET | `/sponsors/:id/metrics` | Métricas do sponsor |
| POST | `/sponsors` | Criar sponsor (admin) |
| PUT | `/sponsors/:id` | Atualizar (admin) |
| DELETE | `/sponsors/:id` | Remover (admin) |

## 🍔 Merchants `/merchants`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/merchants` | Listar restaurantes |
| GET | `/merchants/:id` | Detalhes do restaurante |
| GET | `/merchants/:id/products` | Cardápio |
| POST | `/merchants` | Criar (owner) |
| PUT | `/merchants/:id` | Atualizar |

## 🛒 Products `/products`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/products` | Listar produtos |
| GET | `/products/:id` | Detalhes do produto |
| POST | `/products` | Criar produto |
| PUT | `/products/:id` | Atualizar |
| DELETE | `/products/:id` | Remover |

## 📦 Orders `/orders`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/orders` | Histórico de pedidos |
| POST | `/orders` | Criar pedido |
| GET | `/orders/:id` | Detalhes do pedido |
| PUT | `/orders/:id/status` | Atualizar status |
| POST | `/orders/:id/cancel` | Cancelar pedido |

## 💳 Payments `/payments`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/payments/process` | Processar pagamento |
| POST | `/payments/webhook` | Webhook Mercado Pago |
| GET | `/payments/:id` | Status do pagamento |

## 🚗 Drivers `/drivers`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/drivers/available` | Entregadores disponíveis |
| POST | `/drivers/register` | Cadastrar entregador |
| PUT | `/drivers/location` | Atualizar localização |
| PUT | `/drivers/status` | Alterar status (online/offline) |

## ⭐ Reviews `/reviews`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/reviews/merchant/:id` | Reviews do restaurante |
| POST | `/reviews` | Criar review |
| GET | `/reviews/order/:id` | Review de um pedido |

## 🎫 Coupons `/coupons`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/coupons/validate` | Validar cupom |
| GET | `/coupons` | Listar cupons (admin) |
| POST | `/coupons` | Criar cupom |

## ⏱️ ETA `/eta`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/eta/delivery` | Calcular tempo de entrega |

## 🔔 Notifications `/notifications`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notifications` | Listar notificações |
| POST | `/notifications/read` | Marcar como lidas |
| PUT | `/notifications/settings` | Configurações |

## 📤 Uploads `/uploads`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/uploads/image` | Upload de imagem |
| POST | `/uploads/audio` | Upload de áudio |
| DELETE | `/uploads/:key` | Remover arquivo |

## 🔍 Search `/search`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/search` | Busca unificada |
| GET | `/search/suggestions` | Sugestões autocomplete |

## 💰 Platform Fees `/platform-fees`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/platform-fees` | Configurações de taxas |
| PUT | `/platform-fees` | Atualizar (admin) |
| GET | `/platform-fees/report` | Relatório de receitas |

## 🛠️ Admin `/admin`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/dashboard` | Métricas do dashboard |
| GET | `/admin/users` | Listar usuários |
| GET | `/admin/orders` | Listar todos pedidos |
| GET | `/admin/reports` | Relatórios |

## ❤️ Health `/health`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status da API |
| GET | `/health/db` | Status do banco |
| GET | `/health/redis` | Status do Redis |

---

# 5️⃣ DIAGRAMA DO SISTEMA

## Arquitetura Geral

```
                            ┌─────────────────────────┐
                            │      CLIENTES           │
                            ├─────────────────────────┤
                            │  📱 Mobile iOS/Android  │
                            │  🖥️  Web Client (Next)  │
                            │  🛵 Driver App          │
                            └───────────┬─────────────┘
                                        │
                                        │ HTTPS / WSS
                                        ▼
                        ┌───────────────────────────────┐
                        │         LOAD BALANCER         │
                        │          (Fly.io)             │
                        └───────────────┬───────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │   API Node 1  │  │   API Node 2  │  │   API Node N  │
            │   (NestJS)    │  │   (NestJS)    │  │   (NestJS)    │
            └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                    │                  │                   │
                    └──────────────────┼───────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
               ▼                       ▼                       ▼
      ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
      │   PostgreSQL    │    │     Redis       │    │   Socket.IO     │
      │   (Database)    │    │   (Cache/PubSub)│    │   (Realtime)    │
      │                 │    │                 │    │                 │
      │ • Users         │    │ • Sessions      │    │ • Chat          │
      │ • Orders        │    │ • Rate Limiting │    │ • Order Status  │
      │ • Listings      │    │ • Socket State  │    │ • Driver GPS    │
      │ • Messages      │    │                 │    │                 │
      └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Serviços Externos

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVIÇOS EXTERNOS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │   OpenAI    │   │ Mercado Pago│   │  Firebase   │              │
│  │   Whisper   │   │  Payments   │   │    FCM      │              │
│  │             │   │             │   │             │              │
│  │ Transcrição │   │ • Cartão    │   │ Push Notif. │              │
│  │ de Áudio    │   │ • PIX       │   │             │              │
│  │             │   │ • Boleto    │   │             │              │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │
│         │                 │                 │                      │
├─────────┴─────────────────┴─────────────────┴──────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │   AWS S3    │   │   Google    │   │   Sentry    │              │
│  │ Cloudflare  │   │    Maps     │   │  Monitoring │              │
│  │     R2      │   │             │   │             │              │
│  │             │   │ • Geocoding │   │ • Erros     │              │
│  │ Storage de  │   │ • Routing   │   │ • Perf.     │              │
│  │ Arquivos    │   │ • ETA       │   │ • Logs      │              │
│  └─────────────┘   └─────────────┘   └─────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados Simplificado

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  USUÁRIO           APP              API               DATABASE      │
│     │               │                │                    │         │
│     │  Toca "Criar" │                │                    │         │
│     │──────────────►│                │                    │         │
│     │               │                │                    │         │
│     │  Grava áudio  │                │                    │         │
│     │──────────────►│                │                    │         │
│     │               │                │                    │         │
│     │               │ POST /ai-listing/audio              │         │
│     │               │───────────────►│                    │         │
│     │               │                │                    │         │
│     │               │                │──► OpenAI Whisper  │         │
│     │               │                │◄── Transcrição     │         │
│     │               │                │                    │         │
│     │               │                │──► Extrai dados    │         │
│     │               │                │                    │         │
│     │               │                │ INSERT listing     │         │
│     │               │                │───────────────────►│         │
│     │               │                │                    │         │
│     │               │◄───────────────│ Listing criado     │         │
│     │               │                │                    │         │
│     │◄──────────────│ Sucesso!       │                    │         │
│     │               │                │                    │         │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 📊 SUMÁRIO EXECUTIVO

## Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Módulos Backend** | 23 |
| **Endpoints REST** | 70+ |
| **Eventos WebSocket** | 6 |
| **Telas Mobile** | 15+ |
| **Páginas Web** | 20+ |
| **Modelos Prisma** | 25+ |

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | NestJS 10 + TypeScript |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Cache** | Redis |
| **Web** | Next.js 14 (App Router) |
| **Mobile** | React Native + Expo |
| **Realtime** | Socket.IO |
| **AI** | OpenAI Whisper |
| **Payments** | Mercado Pago |
| **Storage** | AWS S3 / Cloudflare R2 |
| **Push** | Firebase Cloud Messaging |
| **Deploy** | Fly.io (API) + Vercel (Web) |

## Funcionalidades Core

- ✅ Delivery de comida com rastreamento
- ✅ Marketplace C2C com categorias
- ✅ Chat em tempo real
- ✅ Publicação por texto/áudio (IA)
- ✅ Feed da comunidade
- ✅ Sistema de patrocínio
- ✅ Pagamentos integrados
- ✅ Painel administrativo

---

**Documento gerado automaticamente em 11 de março de 2026**
