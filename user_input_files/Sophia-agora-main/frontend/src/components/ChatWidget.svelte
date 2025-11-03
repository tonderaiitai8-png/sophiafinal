<script lang="ts">
  import { afterUpdate, onMount } from 'svelte'
  import MenuBrowser from './MenuBrowser.svelte'
  import type { MenuItem as MenuBrowserItem } from './MenuBrowser.svelte'

  const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3002'
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
  let inputValue = ''
  let sending = false

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
    "What's popular tonight?",
    'Show me my cart',
    'Add the Hot Stuff burger'
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
      sessionId = data.sessionId
      cart = data.cart
      pushMessage(createMessage('assistant', data.reply))
    } catch (error: any) {
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
</script>

<div class="experience">
  <div class="experience__container">
    <section class="panel panel--summary">
      <header class="summary__header">
        <div class="summary__intro">
          <p class="summary__kicker">{config?.restaurantInfo.name ?? 'Sophia'}</p>
          <h1 class="summary__title">Smart ordering assistant</h1>
          <p class="summary__tagline">
            {config?.restaurantInfo.tagline ?? 'Bring your takeaway menu to life with an interactive assistant.'}
          </p>
        </div>
        {#if config}
          <div class="summary__contact">
            <p class="summary__contact-title">Contact & hours</p>
            <p>{config.restaurantInfo.location}</p>
            <p>{config.restaurantInfo.phone}</p>
            <p>{config.restaurantInfo.hours}</p>
          </div>
        {/if}
      </header>

      <section class="highlights">
        {#if config}
          {#each config.highlights as highlight}
            <div class="highlights__item">{highlight}</div>
          {/each}
        {:else if loadingConfig}
          {#each Array(4) as _}
            <div class="skeleton skeleton--highlight"></div>
          {/each}
        {/if}
      </section>

      <div class="summary__content">
        <div class="menu-panel">
          <div class="menu-panel__header">
            <h2>Menu browser</h2>
            {#if loadingConfig}
              <span class="spinner"></span>
            {/if}
          </div>
          {#if fetchError}
            <div class="menu-panel__error">
              <p>{fetchError}</p>
              <button class="button button--primary button--sm" on:click={loadConfig}>Retry</button>
            </div>
          {:else if config}
            <MenuBrowser categories={config.categories} on:add={handleMenuAdd} />
          {:else}
            <div class="menu-panel__skeletons">
              {#each Array(3) as _}
                <div class="skeleton"></div>
              {/each}
            </div>
          {/if}
        </div>

        <aside class="cart-panel">
          <div>
            <h2>Live cart</h2>
            <p class="cart-panel__subtitle">Tap dishes or ask Sophia to build the order. Everything updates instantly.</p>
          </div>

          {#if cart.items.length === 0}
            <div class="cart-panel__empty">
              Your cart is empty. Select an item to see how Sophia updates it in real time.
            </div>
          {:else}
            <ul class="cart-panel__items">
              {#each cart.items as item (item.id)}
                <li class="cart-panel__item">
                  <div>
                    <p class="cart-panel__item-name">{cartLineLabel(item)}</p>
                    <p class="cart-panel__item-price">{formatCurrency(item.price)} each</p>
                  </div>
                  <span class="cart-panel__item-total">{formatCurrency(item.total)}</span>
                </li>
              {/each}
            </ul>
            <div class="cart-panel__total">
              <span>Total</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>
          {/if}
        </aside>
      </div>
    </section>

    <section class="panel panel--chat">
      <header class="chat__header">
        <div>
          <p class="summary__kicker">Sophia</p>
          <h2 class="chat__title">Conversational order flow</h2>
        </div>
        <span class="badge badge--outline">Demo ready</span>
      </header>

      <div class="chat__history" bind:this={chatBody}>
        {#if messages.length === 0}
          <div class="chat__empty">Assistant responses will appear here.</div>
        {:else}
          {#each messages as message (message.id)}
            <div class={`chat__row chat__row--${message.sender}`}>
              <div class="chat__avatar">
                {message.sender === 'user' ? 'You' : 'S'}
              </div>
              <div class={`chat__bubble chat__bubble--${message.sender}`}>
                <p>{message.text}</p>
                <div class="chat__meta">
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {#if message.synthetic}
                    <span class="chat__meta-note">from menu</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="chat__actions">
        <div class="quick-prompts">
          {#each quickPrompts as prompt}
            <button class="button button--ghost button--xs" on:click={() => sendMessage(prompt)} disabled={sending}>
              {prompt}
            </button>
          {/each}
        </div>

        <form class="chat__form" on:submit|preventDefault={() => sendMessage()}>
          <input
            class="input"
            placeholder="Ask Sophia to add dishes, show the cart, or clear the order..."
            bind:value={inputValue}
            disabled={sending}
          />
          <button class="button button--primary" type="submit" disabled={sending}>
            {#if sending}
              <span class="spinner spinner--small"></span>
            {:else}
              Send
            {/if}
          </button>
        </form>
        <p class="chat__disclaimer">
          This demo keeps everything on-device — no external AI calls required. Perfect for showcasing a branded ordering flow.
        </p>
      </div>
    </section>
  </div>
</div>

<style>
  .experience {
    min-height: 100vh;
    background: var(--surface-muted);
    padding: 3.5rem 0;
  }

  .experience__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.75rem;
    display: grid;
    gap: 2.5rem;
  }

  @media (min-width: 1024px) {
    .experience__container {
      grid-template-columns: 1.15fr 0.85fr;
    }
  }

  .panel {
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .panel--summary {
    gap: 2.5rem;
  }

  .summary__header {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  @media (min-width: 900px) {
    .summary__header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  .summary__intro {
    max-width: 560px;
  }

  .summary__kicker {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--secondary);
    margin-bottom: 0.5rem;
  }

  .summary__title {
    margin: 0;
    font-size: clamp(2rem, 2.5vw + 1rem, 3rem);
    font-weight: 800;
  }

  .summary__tagline {
    margin: 0.75rem 0 0;
    color: var(--text-muted);
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .summary__contact {
    background: var(--surface-subtle);
    border-radius: 18px;
    padding: 1.5rem 1.75rem;
    font-size: 0.95rem;
    line-height: 1.6;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  }

  .summary__contact-title {
    margin: 0 0 0.5rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
  }

  .highlights {
    display: grid;
    gap: 1.2rem;
  }

  @media (min-width: 720px) {
    .highlights {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .highlights__item {
    background: var(--surface-subtle);
    border-radius: 18px;
    padding: 1.4rem 1.6rem;
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.5;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
  }

  .summary__content {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  @media (min-width: 960px) {
    .summary__content {
      flex-direction: row;
      align-items: stretch;
    }
  }

  .menu-panel {
    flex: 1;
    background: var(--surface-subtle);
    border-radius: 20px;
    padding: 1.75rem;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
    min-height: 420px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .menu-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .menu-panel__error {
    background: rgba(244, 114, 182, 0.12);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: #9d174d;
  }

  .menu-panel__skeletons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .menu-panel__skeletons .skeleton {
    height: 80px;
  }

  .cart-panel {
    width: 100%;
    max-width: 320px;
    background: var(--surface-subtle);
    border-radius: 20px;
    padding: 1.75rem;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .cart-panel__subtitle {
    color: var(--text-muted);
    margin: 0.35rem 0 0;
    font-size: 0.9rem;
  }

  .cart-panel__empty {
    background: rgba(99, 102, 241, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    color: #4338ca;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .cart-panel__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 260px;
    overflow-y: auto;
  }

  .cart-panel__item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .cart-panel__item-name {
    margin: 0 0 0.25rem;
    font-weight: 600;
  }

  .cart-panel__item-price {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .cart-panel__item-total {
    font-weight: 700;
    color: var(--primary);
  }

  .cart-panel__total {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    font-size: 1rem;
  }

  .cart-panel__total span:last-child {
    font-size: 1.5rem;
    color: var(--primary);
  }

  .panel--chat {
    gap: 1.75rem;
  }

  .chat__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat__title {
    margin: 0.35rem 0 0;
    font-size: 1.9rem;
    font-weight: 800;
  }

  .chat__history {
    flex: 1;
    min-height: 320px;
    max-height: 460px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding-right: 0.5rem;
  }

  .chat__empty {
    margin: auto;
    color: var(--text-light);
    font-size: 0.95rem;
  }

  .chat__row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .chat__row--user {
    flex-direction: row-reverse;
    text-align: right;
  }

  .chat__avatar {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--secondary);
    color: #fff;
    font-weight: 700;
    display: grid;
    place-items: center;
  }

  .chat__row--user .chat__avatar {
    background: var(--primary);
  }

  .chat__bubble {
    max-width: min(540px, 75%);
    padding: 0.9rem 1.1rem;
    border-radius: 18px;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  }

  .chat__bubble--assistant {
    background: var(--surface-subtle);
  }

  .chat__bubble--user {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95));
    color: #fff;
  }

  .chat__bubble--system {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
  }

  .chat__bubble p {
    margin: 0;
    white-space: pre-line;
  }

  .chat__meta {
    margin-top: 0.45rem;
    font-size: 0.75rem;
    display: flex;
    gap: 0.75rem;
    color: rgba(15, 23, 42, 0.55);
  }

  .chat__row--user .chat__meta {
    justify-content: flex-end;
    color: rgba(255, 255, 255, 0.75);
  }

  .chat__bubble--system .chat__meta {
    color: rgba(37, 99, 235, 0.8);
  }

  .chat__meta-note {
    font-style: italic;
    text-transform: lowercase;
  }

  .chat__actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .chat__form {
    display: flex;
    gap: 0.75rem;
  }

  .chat__disclaimer {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-light);
  }

  @media (max-width: 960px) {
    .panel {
      padding: 2rem;
    }

    .cart-panel {
      max-width: none;
    }

    .summary__content {
      gap: 1.25rem;
    }

    .chat__history {
      max-height: none;
    }
  }
</style>
