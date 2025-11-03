import restaurantConfig from './restaurant-config.json';

// TypeScript interfaces
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  allergens?: string[];
  tags?: string[];
  options?: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RestaurantConfig {
  restaurantInfo: {
    name: string;
    location: string;
    phone: string;
    hours: Record<string, string>;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  prompts: {
    welcomeMessage: string;
    systemPrompt: string;
  };
  menu: {
    categories: MenuCategory[];
  };
}

// Export config
export const RESTAURANT_CONFIG: RestaurantConfig = restaurantConfig as RestaurantConfig;

// Build menu lookup
export const MENU_LOOKUP: Record<string, MenuItem & { category: string }> = {};
export const ALL_ALLERGENS = new Set<string>();

RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
  cat.items.forEach((item) => {
    MENU_LOOKUP[item.id] = { ...item, category: cat.name };
    if (item.allergens) {
      item.allergens.forEach((allergen) => ALL_ALLERGENS.add(allergen));
    }
  });
});

// Helper to get menu items for AI context
export function getMenuForAI() {
  return RESTAURANT_CONFIG.menu.categories.map((cat) => ({
    category: cat.name,
    items: cat.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      allergens: item.allergens || [],
      tags: item.tags || []
    }))
  }));
}

// Helper to search menu
export function searchMenu(options: {
  exclude_allergens?: string[];
  dietary_tags?: string[];
  max_price?: number;
}) {
  const { exclude_allergens = [], dietary_tags = [], max_price } = options;
  const results: MenuItem[] = [];
  
  RESTAURANT_CONFIG.menu.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      // Check allergens
      if (exclude_allergens.length > 0) {
        const hasAllergen = item.allergens?.some((a) => 
          exclude_allergens.some((ea) => a.toLowerCase().includes(ea.toLowerCase()))
        );
        if (hasAllergen) return;
      }

      // Check dietary tags
      if (dietary_tags.length > 0) {
        const hasTags = dietary_tags.every((tag) =>
          item.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
        if (!hasTags) return;
      }

      // Check price
      if (max_price !== undefined && item.price > max_price) return;

      results.push(item);
    });
  });

  return results;
}
