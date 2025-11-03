export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  keywords: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

export interface RestaurantConfig {
  restaurantInfo: {
    name: string;
    location: string;
    phone: string;
    tagline: string;
    hours: string;
  };
  highlights: string[];
  categories: MenuCategory[];
  prompts: {
    welcomeMessage: string;
    suggestMessage: string;
  };
}

export const RESTAURANT_CONFIG: RestaurantConfig = {
  restaurantInfo: {
    name: "Woody's Burger, Chicken & Ribs",
    location: "37 London Street, Andover, SP10 2NU, UK",
    phone: "+44 1264 359811",
    tagline: "Hand-crafted peri peri chicken, burgers, and crowd-pleasing sides.",
    hours: "Sun-Thu 12:00-22:00 · Fri-Sat 12:00-23:00"
  },
  highlights: [
    "🔥 Freshly grilled Peri Peri chicken in four heat levels",
    "🍔 Prime beef burgers with artisan brioche buns",
    "🥗 Family-friendly combos and vegetarian options",
    "⚡️ 15-minute average pickup time"
  ],
  categories: [
    {
      id: "peri-peri",
      name: "🌶️ Peri Peri Chicken",
      description: "Flame-grilled peri peri chicken finished with our signature sauces.",
      items: [
        {
          id: "peri-wrap",
          name: "Peri Peri Chicken Wrap & Fries",
          price: 6.99,
          description: "Fresh grilled peri peri chicken, crunchy slaw, toasted tortilla, and golden fries.",
          keywords: ["peri", "wrap", "chicken wrap"]
        },
        {
          id: "peri-wings",
          name: "5pcs Peri Peri Wings & Fries",
          price: 6.99,
          description: "Five spicy wings finished with peri peri glaze, served with fries.",
          keywords: ["wings", "peri wings", "spicy wings"]
        }
      ]
    },
    {
      id: "burgers",
      name: "🍔 Burgers",
      description: "Stacked burgers with locally baked brioche buns.",
      items: [
        {
          id: "cluffie",
          name: "Cluffie",
          price: 6.2,
          description: "Classic seasoned beef burger with lettuce and tomato.",
          keywords: ["cluffie", "classic burger"]
        },
        {
          id: "cheese-job",
          name: "Cheese Job",
          price: 6.5,
          description: "Beef burger with double cheddar and secret sauce.",
          keywords: ["cheese job", "cheese", "cheeseburger"]
        },
        {
          id: "hot-stuff",
          name: "Hot Stuff",
          price: 6.9,
          description: "Chilli jam, jalapeños, and chipotle mayo heat things up.",
          keywords: ["hot", "spicy burger", "hot stuff"]
        }
      ]
    },
    {
      id: "sides",
      name: "🍟 Sides",
      description: "Shareable sides fried to order.",
      items: [
        {
          id: "fries",
          name: "Fries",
          price: 2.5,
          description: "Crispy double-cooked fries with sea salt.",
          keywords: ["fries", "chips"]
        },
        {
          id: "wings",
          name: "BBQ Wings",
          price: 4.95,
          description: "Sweet and smoky wings brushed with house BBQ sauce.",
          keywords: ["bbq wings", "wings", "bbq"]
        }
      ]
    }
  ],
  prompts: {
    welcomeMessage: "👋 Hi, I'm Sophia — your ordering assistant. Fancy something spicy or are you in a burger mood?",
    suggestMessage: "Our chefs recommend the Peri Peri Chicken Wrap or the Hot Stuff burger tonight."
  }
};

export const MENU_LOOKUP: Record<string, MenuItem> = Object.fromEntries(
  RESTAURANT_CONFIG.categories.flatMap((category) =>
    category.items.map((item) => [item.id, item])
  )
);

export const KEYWORDS_TO_ITEM: Record<string, string> = Object.fromEntries(
  RESTAURANT_CONFIG.categories.flatMap((category) =>
    category.items.flatMap((item) =>
      item.keywords.map((keyword) => [keyword, item.id])
    )
  )
);
