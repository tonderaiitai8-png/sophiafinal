<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export interface MenuItem {
    id: string
    name: string
    price: number
    description?: string
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

  $: if (categories.length > 0 && !categories.find((category) => category.id === activeCategoryId)) {
    activeCategoryId = categories[0].id
  }

  $: activeCategory = categories.find((category) => category.id === activeCategoryId)

  function selectItem(item: MenuItem) {
    dispatch('add', item)
  }
</script>

<div class="menu-browser">
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
    <div class="menu-browser__list">
      {#each activeCategory.items as item (item.id)}
        <article class="menu-card">
          <div class="menu-card__header">
            <div>
              <h3>{item.name}</h3>
              {#if item.description}
                <p>{item.description}</p>
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

  .menu-browser__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .menu-browser__tab {
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    padding: 0.45rem 1rem;
    background: rgba(248, 250, 252, 0.9);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .menu-browser__tab.is-active {
    background: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: 0 10px 18px rgba(249, 115, 22, 0.12);
  }

  .menu-browser__description {
    margin: 0;
    color: var(--text-light);
    font-size: 0.85rem;
  }

  .menu-browser__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .menu-card {
    background: var(--surface);
    border-radius: 18px;
    padding: 1.2rem 1.35rem;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .menu-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .menu-card__header h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .menu-card__header p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .menu-card__price {
    font-weight: 700;
    color: var(--primary);
    white-space: nowrap;
  }

  .menu-browser__empty {
    border-radius: 16px;
    background: rgba(99, 102, 241, 0.1);
    color: #4338ca;
    padding: 1.5rem;
    font-size: 0.9rem;
  }
</style>
