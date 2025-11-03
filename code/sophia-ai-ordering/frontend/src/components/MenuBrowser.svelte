<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export interface MenuItem {
    id: string
    name: string
    price: number
    description?: string
    allergens?: string[]
    tags?: string[]
  }

  export interface MenuCategory {
    id: string
    name: string
    description?: string
    items: MenuItem[]
  }

  export let categories: MenuCategory[] = []

  const dispatch = createEventDispatcher<{ add: MenuItem }>()
  let activeCategoryId: string | null = null
  let searchQuery = ''

  $: if (categories.length > 0 && !categories.find((category) => category.id === activeCategoryId)) {
    activeCategoryId = categories[0].id
  }

  $: activeCategory = categories.find((category) => category.id === activeCategoryId)
  
  $: filteredItems = activeCategory?.items.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }) || []

  function selectItem(item: MenuItem) {
    dispatch('add', item)
  }

  function getAllergenBadgeColor(allergen: string): string {
    const colors: Record<string, string> = {
      'Gluten': '#EF4444',
      'Dairy': '#F59E0B',
      'Nuts': '#DC2626',
      'Eggs': '#FBBF24',
      'Soy': '#10B981',
      'Celery': '#06B6D4'
    }
    return colors[allergen] || '#6B7280'
  }
</script>

<div class="menu-browser">
  <!-- Search Bar -->
  <div class="search-bar">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="search-icon">
      <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <input
      type="text"
      class="search-input"
      placeholder="Search menu..."
      bind:value={searchQuery}
    />
    {#if searchQuery}
      <button class="search-clear" on:click={() => searchQuery = ''}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 10.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Category Tabs -->
  <div class="menu-browser__tabs">
    {#each categories as category (category.id)}
      <button
        class={`menu-browser__tab ${activeCategoryId === category.id ? 'is-active' : ''}`}
        type="button"
        on:click={() => (activeCategoryId = category.id)}
      >
        {category.name}
      </button>
    {/each}
  </div>

  {#if activeCategory?.description}
    <p class="menu-browser__description">{activeCategory.description}</p>
  {/if}

  {#if activeCategory}
    {#if filteredItems.length === 0}
      <div class="empty-results">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <path d="M32 22v20M22 32h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No items found</p>
      </div>
    {:else}
      <div class="menu-browser__list">
        {#each filteredItems as item, i (item.id)}
          <article class="menu-card animate-scale-in" style="animation-delay: {i * 0.05}s">
            <div class="menu-card__header">
              <div>
                <h3>{item.name}</h3>
                {#if item.description}
                  <p>{item.description}</p>
                {/if}
                {#if item.tags && item.tags.length > 0}
                  <div class="tags">
                    {#each item.tags as tag}
                      <span class="tag">{tag}</span>
                    {/each}
                  </div>
                {/if}
                {#if item.allergens && item.allergens.length > 0}
                  <div class="allergens">
                    {#each item.allergens.slice(0, 3) as allergen}
                      <span 
                        class="allergen-badge" 
                        style="background-color: {getAllergenBadgeColor(allergen)}20; color: {getAllergenBadgeColor(allergen)}; border-color: {getAllergenBadgeColor(allergen)}40"
                      >
                        {allergen}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
              <span class="menu-card__price">£{item.price.toFixed(2)}</span>
            </div>
            <button class="button button--primary button--sm" type="button" on:click={() => selectItem(item)}>
              Add to order
            </button>
          </article>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="menu-browser__empty">
      Menu data will appear here once the configuration has loaded.
    </div>
  {/if}
</div>

<style>
  .menu-browser {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }

  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1.125rem 0.875rem 3rem;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--border-medium);
    background: var(--surface);
    font-size: 0.9375rem;
    color: var(--text-main);
    transition: all var(--transition-base);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-light);
  }

  .search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(196, 30, 58, 0.1);
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 50%;
    transition: all var(--transition-fast);
  }

  .search-clear:hover {
    background: var(--gray-200);
    color: var(--text-main);
  }

  .menu-browser__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .menu-browser__tab {
    border-radius: 999px;
    border: 1.5px solid var(--border-medium);
    padding: 0.625rem 1.25rem;
    background: var(--surface);
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
  }

  .menu-browser__tab:hover {
    border-color: var(--primary);
    color: var(--text-main);
    transform: translateY(-1px);
  }

  .menu-browser__tab.is-active {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-color: transparent;
    color: white;
    box-shadow: var(--shadow-md), 0 4px 20px rgba(196, 30, 58, 0.3);
  }

  .menu-browser__description {
    margin: 0;
    padding: 1rem 1.25rem;
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    font-size: 0.9375rem;
    border-left: 3px solid var(--primary);
  }

  .empty-results {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-light);
  }

  .empty-results p {
    margin: 1rem 0 0;
    color: var(--text-muted);
  }

  .menu-browser__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .menu-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all var(--transition-base);
  }

  .menu-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary);
  }

  .menu-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .menu-card__header h3 {
    margin: 0 0 0.35rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .menu-card__header p {
    margin: 0.5rem 0;
    font-size: 0.9375rem;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .menu-card__price {
    font-weight: 800;
    font-size: 1.25rem;
    color: var(--primary);
    white-space: nowrap;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .tag {
    padding: 0.25rem 0.625rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .allergens {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .allergen-badge {
    padding: 0.25rem 0.625rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .menu-browser__empty {
    border-radius: var(--radius-lg);
    background: rgba(99, 102, 241, 0.1);
    color: #4338ca;
    padding: 2rem;
    font-size: 0.9375rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .menu-card {
      padding: 1.25rem;
    }

    .menu-card__header h3 {
      font-size: 1rem;
    }

    .menu-card__price {
      font-size: 1.125rem;
    }
  }
</style>
