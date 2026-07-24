var MENU = {
  categories: [
    {
      id: "drinks",
      label: "Drinks",
      image: "img/drinks.png",
      items: [
        { id: "latte", label: "Latte", basePrice: 5.45, modifiers: buildDrinkModifiers() },
        { id: "mocha", label: "Mocha", basePrice: 5.2, modifiers: buildDrinkModifiers() },
        { id: "breve", label: "Breve", basePrice: 5.35, modifiers: buildDrinkModifiers() },
        { id: "americano", label: "Americano", basePrice: 4.0, modifiers: buildDrinkModifiers() },
        { id: "cappuccino", label: "Cappuccino", basePrice: 5.45, modifiers: buildDrinkModifiers() },
        { id: "frappuccino", label: "Frappuccino", basePrice: 6.25, modifiers: buildDrinkModifiers() },
        { id: "matcha", label: "Matcha", basePrice: 5.25, modifiers: buildDrinkModifiers() },
        { id: "chai", label: "Chai", basePrice: 5.25, modifiers: buildDrinkModifiers() },
        { id: "green-tea", label: "Green Tea", basePrice: 3.8, modifiers: buildDrinkModifiers() },
        { id: "black-tea", label: "Black Tea", basePrice: 3.8, modifiers: buildDrinkModifiers() },
        { id: "hot-chocolate", label: "Hot Chocolate", basePrice: 3.95, modifiers: buildDrinkModifiers() },
        { id: "steamer", label: "Steamer", basePrice: 3.25, modifiers: buildDrinkModifiers() }
      ]
    },
    {
      id: "food",
      label: "Food",
      image: "img/croissant.png",
      items: [
        { id: "croissant", label: "Croissant", basePrice: 2.5, modifiers: [] },
        { id: "doughnut", label: "Doughnut", basePrice: 1.95, modifiers: [] }
      ]
    },
    {
      id: "merch",
      label: "Merch",
      image: "img/tshirt.png",
      items: [
        {
          id: "t-shirt",
          label: "T-shirt",
          basePrice: 18,
          modifiers: [
            {
              id: "merch-size",
              label: "Size",
              selection: "single",
              options: [
                { id: "small", label: "Small", priceDelta: 0, inputType: "none" },
                { id: "medium", label: "Medium", priceDelta: 0, inputType: "none" },
                { id: "large", label: "Large", priceDelta: 0, inputType: "none" },
                { id: "extra-large", label: "Extra Large", priceDelta: 0, inputType: "none" }
              ]
            }
          ]
        },
        {
          id: "hat",
          label: "Hat",
          basePrice: 14,
          modifiers: []
        },
        {
          id: "mug",
          label: "Mug",
          basePrice: 12,
          modifiers: []
        }
      ]
    }
  ]
};

var SAMPLE_MENU = {
  categories: [
    {
      id: "drinks",
      label: "Drinks",
      image: "img/drinks.png",
      items: [
        { id: "sample-latte", label: "Sample Latte", basePrice: 4.75, modifiers: [] },
        { id: "sample-tea", label: "Sample Tea", basePrice: 3.5, modifiers: [] }
      ]
    },
    {
      id: "food",
      label: "Food",
      image: "img/croissant.png",
      items: [
        { id: "sample-muffin", label: "Sample Muffin", basePrice: 2.25, modifiers: [] }
      ]
    },
    {
      id: "merch",
      label: "Merch",
      image: "img/tshirt.png",
      items: [
        { id: "sample-mug", label: "Sample Mug", basePrice: 10, modifiers: [] },
        { id: "sample-shirt", label: "Sample Shirt", basePrice: 16, modifiers: [] }
      ]
    }
  ]
};

MENU = normalizeMenu(MENU);

function buildDrinkModifiers() {
  return [
    {
      id: "size",
      label: "Size",
      selection: "single",
      options: [
        { id: "small", label: "Small", priceDelta: 0, inputType: "none" },
        { id: "medium", label: "Medium", priceDelta: 0.65, inputType: "none" },
        { id: "large", label: "Large", priceDelta: 1.3, inputType: "none" },
        { id: "extra-large", label: "Extra Large", priceDelta: 1.95, inputType: "none" }
      ]
    },
    {
      id: "type",
      label: "Type",
      selection: "single",
      options: [
        { id: "hot", label: "Hot", priceDelta: 0, inputType: "none" },
        { id: "iced", label: "Iced", priceDelta: 0, inputType: "none" },
        { id: "extra-hot", label: "Extra hot", priceDelta: 0, inputType: "none" },
        { id: "espresso", label: "Espresso", priceDelta: 0, inputType: "none" },
        { id: "decaf", label: "Decaf", priceDelta: 0, inputType: "none" },
        { id: "half-caf", label: "Half caf", priceDelta: 0, inputType: "none" }
      ]
    },
    {
      id: "espresso-shot",
      label: "Espresso shot",
      selection: "quantity",
      options: [
        { id: "extra-shot", label: "Extra Espresso Shot", priceDelta: 0.8, inputType: "plus/minus", min: 0, max: 3 }
      ]
    },
    {
      id: "milk",
      label: "Milk",
      selection: "single",
      options: [
        { id: "non-fat", label: "Non Fat", priceDelta: 0, inputType: "none" },
        { id: "two-percent", label: "2%", priceDelta: 0, inputType: "none" },
        { id: "whole", label: "Whole", priceDelta: 0, inputType: "none" },
        { id: "almond", label: "Almond", priceDelta: 0.9, inputType: "none" },
        { id: "soy", label: "Soy", priceDelta: 0.9, inputType: "none" },
        { id: "coconut", label: "Coconut", priceDelta: 0.9, inputType: "none" },
        { id: "oat", label: "Oat", priceDelta: 0.9, inputType: "none" }
      ]
    },
    {
      id: "add-ons",
      label: "Add-ons",
      selection: "multi",
      options: [
        { id: "whipped-cream", label: "Whipped cream", priceDelta: 0, inputType: "none" },
        { id: "cold-foam", label: "Cold foam", priceDelta: 1, inputType: "none" }
      ]
    },
    {
      id: "sweeteners",
      label: "Sweeteners",
      selection: "mixed",
      options: [
        { id: "sugar", label: "Sugar", priceDelta: 0, inputType: "plus/minus", min: 0, max: 3 },
        { id: "splenda", label: "Splenda", priceDelta: 0, inputType: "plus/minus", min: 0, max: 3 },
        { id: "stevia", label: "Stevia", priceDelta: 0, inputType: "none" }
      ]
    },
    {
      id: "flavors",
      label: "Flavors / Syrups",
      selection: "multi",
      options: [
        { id: "hazelnut", label: "Hazelnut", priceDelta: 0.8, inputType: "none" },
        { id: "lavender", label: "Lavender", priceDelta: 0.8, inputType: "none" },
        { id: "peach", label: "Peach", priceDelta: 0.8, inputType: "none" },
        { id: "salted-caramel", label: "Salted Caramel", priceDelta: 0.8, inputType: "none" },
        { id: "almond", label: "Almond", priceDelta: 0.8, inputType: "none" },
        { id: "irish-creme", label: "Irish Creme", priceDelta: 0.8, inputType: "none" },
        { id: "chocolate", label: "Chocolate", priceDelta: 0.8, inputType: "none" }
      ]
    }
  ];
}

function normalizeMenu(menuCandidate) {
  if (!isMenuValid(menuCandidate)) {
    return SAMPLE_MENU;
  }
  return menuCandidate;
}

function isMenuValid(menuCandidate) {
  if (!menuCandidate || !Array.isArray(menuCandidate.categories) || menuCandidate.categories.length === 0) {
    return false;
  }

  var hasItem = false;
  var i = 0;
  var j = 0;

  for (i = 0; i < menuCandidate.categories.length; i += 1) {
    if (!menuCandidate.categories[i].items || menuCandidate.categories[i].items.length === 0) {
      continue;
    }

    for (j = 0; j < menuCandidate.categories[i].items.length; j += 1) {
      if (menuCandidate.categories[i].items[j].label) {
        hasItem = true;
        break;
      }
    }

    if (hasItem) {
      break;
    }
  }

  return hasItem;
}
