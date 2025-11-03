<script lang="ts">
  import { afterUpdate, onMount } from 'svelte'
  import MenuBrowser from './MenuBrowser.svelte'
  import type { MenuItem as MenuBrowserItem } from './MenuBrowser.svelte'

  const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'
  const RESTAURANT_ID = 'woodys'

  interface Message {
    id: number
    sender: 'assistant' | 'user' | 'system'
    text: string
    timestamp: Date
    synthetic?: boolean
  }

  interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    total: number
  }

  interface CartState {
    items: CartItem[]
    total: number
    itemCount: number
  }

  interface RestaurantConfig {
    restaurantInfo: {
      name: string
      location: string
      phone: string
      tagline: string
      hours: string
    }
    highlights: string[]
    categories: Array<{
      id: string
      name: string
      description?: string
      items: Array<{
        id: string
        name: string
        price: number
        description?: string
        allergens?: string[]
        tags?: string[]
      }>
    }>
    prompts: {
      welcomeMessage: string
      suggestMessage: string
    }
  }

  let config: RestaurantConfig | null = null
  let loadingConfig = true
  let fetchError: string | null = null
  let messages: Message[] = []
  let cart: CartState = { items: [], total: 0, itemCount: 0 }
  let prevCartTotal = 0
  let inputValue = ''
  let sending = false
  let isTyping = false

  function createSessionId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    const randomPart = Math.random().toString(36).slice(2)
    const timestampPart = Date.now().toString(36)
    return `${timestampPart}-${randomPart}`
  }

  let sessionId = createSessionId()
  let chatBody: HTMLDivElement | null = null
  let messageCounter = 0
  let shouldScroll = false

  const quickPrompts = [
    "What's popular?",
    "I'm allergic to gluten",
    "Vegetarian options"
  ]

  const formatCurrency = (value: number) => `£${value.toFixed(2)}`
  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  onMount(async () => {
    await loadConfig()
  })

  afterUpdate(() => {
    if (shouldScroll && chatBody) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' })
      shouldScroll = false
    }
  })

  function createMessage(sender: Message['sender'], text: string, synthetic = false): Message {
    messageCounter += 1
    return {
      id: messageCounter,
      sender,
      text,
      timestamp: new Date(),
      synthetic
    }
  }

  function pushMessage(message: Message) {
    messages = [...messages, message]
    shouldScroll = true
  }

  async function loadConfig() {
    loadingConfig = true
    fetchError = null

    try {
      const response = await fetch(`${API_BASE}/api/config/${RESTAURANT_ID}`)
      if (!response.ok) {
        throw new Error('Unable to load the restaurant configuration.')
      }
      const data: RestaurantConfig = await response.json()
      config = data
      messageCounter = 0
      sessionId = createSessionId()
      cart = { items: [], total: 0, itemCount: 0 }
      messages = []
      pushMessage(createMessage('assistant', data.prompts.welcomeMessage))
    } catch (error: any) {
      fetchError = error?.message ?? 'Something went wrong while loading the menu.'
    } finally {
      loadingConfig = false
    }
  }

  async function sendMessage(customText?: string) {
    const text = (customText ?? inputValue).trim()
    if (!text || sending) return

    inputValue = ''
    pushMessage(createMessage('user', text, Boolean(customText)))
    sending = true
    isTyping = true

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      })

      if (!response.ok) {
        throw new Error('Unable to reach the assistant. Please try again.')
      }

      const data: { reply: string; cart: CartState; sessionId: string } = await response.json()
      
      isTyping = false
      sessionId = data.sessionId
      prevCartTotal = cart.total
      cart = data.cart
      
      pushMessage(createMessage('assistant', data.reply))
    } catch (error: any) {
      isTyping = false
      const description = error?.message ?? 'Sorry, something went wrong. Please try again.'
      pushMessage(createMessage('system', description))
    } finally {
      sending = false
    }
  }

  function handleMenuAdd(event: CustomEvent<MenuBrowserItem>) {
    const item = event.detail
    sendMessage(`Add the ${item.name}`)
  }

  function cartLineLabel(item: CartItem) {
    const quantityLabel = item.quantity > 1 ? `${item.quantity} × ` : ''
    return `${quantityLabel}${item.name}`
  }

  $: cartChanged = cart.total !== prevCartTotal && cart.total > 0
</script>

<div class="app-container">
  <div class="content-grid">
    
    <!-- Left Panel: Menu & Info -->
    <section class="panel glass animate-fade-in">
      <header class="panel-header">
        <div class="brand-section">
          <div class="brand-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="url(#gradient1)"/>
              <path d="M24 14c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white"/>
              <defs>
                <linearGradient id="gradient1" x1="4" y1="4" x2="44" y2="44">
                  <stop offset="0%" stop-color="#C41E3A"/>
                  <stop offset="100%" stop-color="#9A1529"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p class="brand-name">{config?.restaurantInfo.name ?? 'Loading...'}</p>
            <h1 class="page-title">AI Ordering Assistant</h1>
            <p class="tagline">
              {config?.restaurantInfo.tagline ?? 'Intelligent ordering powered by AI'}
            </p>
          </div>
        </div>
        
        {#if config}
          <div class="info-card glass">
            <p class="info-label">Contact & Hours</p>
            <p class="info-text">{config.restaurantInfo.location}</p>
            <p class="info-text">{config.restaurantInfo.phone}</p>
            <p class="info-text">{config.restaurantInfo.hours}</p>
          </div>
        {/if}
      </header>

      {#if config && config.highlights}
        <div class="highlights-grid">
          {#each config.highlights as highlight, i}
            <div class="highlight-card" style="animation-delay: {i * 0.1}s">
              {highlight}
            </div>
          {/each}
        </div>
      {/if}

      <div class="menu-section">
        <div class="section-header">
          <h2 class="section-title">Browse Menu</h2>
          {#if loadingConfig}
            <div class="spinner spinner--sm"></div>
          {/if}
        </div>
        
        {#if fetchError}
          <div class="error-card">
            <p>{fetchError}</p>
            <button class="button button--primary button--sm" on:click={loadConfig}>
              Retry
            </button>
          </div>
        {:else if config}
          <MenuBrowser categories={config.categories} on:add={handleMenuAdd} />
        {:else}
          <div class="skeleton-grid">
            {#each Array(3) as _}
              <div class="skeleton" style="height: 80px"></div>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <!-- Right Column: Chat & Cart -->
    <div class="right-column">
      
      <!-- Cart Panel -->
      <aside class="cart-panel glass animate-slide-in" class:cart-highlight={cartChanged}>
        <div class="cart-header">
          <h2 class="section-title">Live Cart</h2>
          {#if cart.itemCount > 0}
            <span class="badge badge--primary">{cart.itemCount} items</span>
          {/if}
        </div>
        <p class="cart-subtitle">
          AI updates your cart in real-time as you chat
        </p>

        {#if cart.items.length === 0}
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="empty-icon">
              <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" opacity="0.2"/>
              <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>Your cart is empty</p>
            <p class="empty-hint">Select items or ask the AI to add them</p>
          </div>
        {:else}
          <ul class="cart-items">
            {#each cart.items as item, i (item.id)}
              <li class="cart-item animate-scale-in" style="animation-delay: {i * 0.05}s">
                <div class="cart-item-info">
                  <p class="cart-item-name">{cartLineLabel(item)}</p>
                  <p class="cart-item-price">{formatCurrency(item.price)} each</p>
                </div>
                <span class="cart-item-total">{formatCurrency(item.total)}</span>
              </li>
            {/each}
          </ul>
          
          <div class="cart-total">
            <span class="total-label">Total</span>
            <span class="total-amount">{formatCurrency(cart.total)}</span>
          </div>
          
          <button class="button button--primary" style="width: 100%; margin-top: 1rem;">
            Proceed to Checkout
          </button>
        {/if}
      </aside>

      <!-- Chat Panel -->
      <section class="chat-panel glass">
        <header class="chat-header">
          <div>
            <p class="brand-name">AI Assistant</p>
            <h2 class="section-title">Conversational Ordering</h2>
          </div>
          <span class="badge badge--outline badge--accent">AI Powered</span>
        </header>

        <div class="chat-messages" bind:this={chatBody}>
          {#if messages.length === 0}
            <div class="chat-empty">
              <p>AI responses will appear here</p>
            </div>
          {:else}
            {#each messages as message (message.id)}
              <div class="message message--{message.sender} animate-fade-in">
                <div class="message-avatar">
                  {#if message.sender === 'user'}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  {:else}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  {/if}
                </div>
                <div class="message-bubble message-bubble--{message.sender}">
                  <p class="message-text">{message.text}</p>
                  <div class="message-meta">
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {#if message.synthetic}
                      <span class="meta-badge">from menu</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
            
            {#if isTyping}
              <div class="message message--assistant animate-fade-in">
                <div class="message-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            {/if}
          {/if}
        </div>

        <div class="chat-actions">
          <div class="quick-prompts">
            {#each quickPrompts as prompt}
              <button 
                class="button button--ghost button--xs" 
                on:click={() => sendMessage(prompt)} 
                disabled={sending}
              >
                {prompt}
              </button>
            {/each}
          </div>

          <form class="chat-form" on:submit|preventDefault={() => sendMessage()}>
            <input
              class="input"
              placeholder="Ask me anything about our menu..."
              bind:value={inputValue}
              disabled={sending}
            />
            <button class="button button--primary" type="submit" disabled={sending || !inputValue.trim()}>
              {#if sending}
                <span class="spinner spinner--sm"></span>
              {:else}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3l16 7-16 7V3zm2 11.5l9.5-4.5L4 5.5v9z"/>
                </svg>
              {/if}
            </button>
          </form>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .app-container {
    min-height: 100vh;
    padding: 2rem 1rem;
  }

  .content-grid {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 1024px) {
    .content-grid {
      grid-template-columns: 1.2fr 0.8fr;
    }
  }

  .panel {
    padding: 2.5rem;
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .glass {
    background: var(--surface-glass);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-glass);
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .panel-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  .brand-section {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }

  .brand-icon {
    flex-shrink: 0;
    animation: scaleIn 0.5s ease-out;
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .brand-name {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.5rem;
  }

  .page-title {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    margin: 0.5rem 0 0;
    color: var(--text-muted);
    font-size: 1.0625rem;
    line-height: 1.6;
  }

  .info-card {
    padding: 1.5rem;
    border-radius: var(--radius-xl);
    min-width: 280px;
  }

  .info-label {
    margin: 0 0 0.75rem;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .info-text {
    margin: 0.25rem 0;
    font-size: 0.9375rem;
    color: var(--text-main);
  }

  .highlights-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .highlight-card {
    padding: 1.25rem 1.5rem;
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.9375rem;
    line-height: 1.5;
    border: 1px solid var(--border-light);
    animation: fadeIn 0.4s ease-out backwards;
    transition: all var(--transition-base);
  }

  .highlight-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
  }

  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .error-card {
    padding: 1.5rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: #DC2626;
  }

  .skeleton-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .cart-panel {
    padding: 2rem;
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: all var(--transition-base);
  }

  .cart-highlight {
    animation: pulse 0.6s ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); box-shadow: 0 0 0 4px rgba(196, 30, 58, 0.2); }
  }

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cart-subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .empty-icon {
    color: var(--text-light);
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    margin: 0;
    color: var(--text-muted);
  }

  .empty-hint {
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .cart-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    transition: all var(--transition-base);
  }

  .cart-item:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .cart-item-info {
    flex: 1;
  }

  .cart-item-name {
    margin: 0 0 0.25rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .cart-item-price {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .cart-item-total {
    font-weight: 700;
    font-size: 1.0625rem;
    color: var(--primary);
    white-space: nowrap;
  }

  .cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 2px solid var(--border-medium);
    margin-top: 0.5rem;
  }

  .total-label {
    font-weight: 600;
    font-size: 1.0625rem;
    color: var(--text-main);
  }

  .total-amount {
    font-weight: 800;
    font-size: 1.75rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chat-panel {
    padding: 2rem;
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 600px;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge--accent {
    color: var(--accent);
    border-color: var(--accent);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-right: 0.5rem;
    min-height: 320px;
  }

  .chat-empty {
    margin: auto;
    text-align: center;
    color: var(--text-light);
    font-size: 0.9375rem;
  }

  .message {
    display: flex;
    gap: 0.875rem;
    align-items: flex-start;
  }

  .message--user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--gray-200) 0%, var(--gray-300) 100%);
    color: var(--gray-600);
  }

  .message--user .message-avatar {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
  }

  .message-bubble {
    max-width: 75%;
    padding: 1rem 1.25rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .message-bubble--assistant {
    background: var(--surface-elevated);
    border: 1px solid var(--border-light);
  }

  .message-bubble--user {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
  }

  .message-bubble--system {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #2563EB;
  }

  .message-text {
    margin: 0;
    white-space: pre-line;
    line-height: 1.6;
  }

  .message-meta {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    display: flex;
    gap: 0.75rem;
    opacity: 0.7;
  }

  .meta-badge {
    font-style: italic;
  }

  .typing-indicator {
    display: flex;
    gap: 0.375rem;
    padding: 1rem 1.25rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary);
    animation: typing 1.4s ease-in-out infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-10px); }
  }

  .chat-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .chat-form {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .chat-form .input {
    flex: 1;
  }

  .chat-form .button {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    .app-container {
      padding: 1rem 0.5rem;
    }

    .panel, .cart-panel, .chat-panel {
      padding: 1.5rem;
    }

    .brand-section {
      flex-direction: column;
    }

    .info-card {
      min-width: auto;
    }
  }
</style>
