import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const restaurantConfig = JSON.parse(readFileSync(join(__dirname, 'restaurant-config.json'), 'utf-8'));
// Export the full restaurant configuration
export const RESTAURANT_CONFIG = restaurantConfig;
// Create a lookup map for quick item access
export const MENU_LOOKUP = {};
RESTAURANT_CONFIG.menu.categories.forEach((category) => {
    category.items.forEach((item) => {
        MENU_LOOKUP[item.id] = item;
    });
});
// Export allergen list
export const ALL_ALLERGENS = Array.from(new Set(RESTAURANT_CONFIG.menu.categories.flatMap((cat) => cat.items.flatMap((item) => item.allergens || [])))).sort();
// Export dietary tags
export const ALL_TAGS = Array.from(new Set(RESTAURANT_CONFIG.menu.categories.flatMap((cat) => cat.items.flatMap((item) => item.tags || [])))).sort();
// Create a rich menu context for AI
export function getMenuForAI() {
    return RESTAURANT_CONFIG.menu.categories.map((category) => ({
        category: category.name,
        items: category.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            allergens: item.allergens || [],
            tags: item.tags || [],
            options: item.options || []
        }))
    }));
}
