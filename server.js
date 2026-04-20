const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const UPLOAD_DIR = path.join(__dirname, "public", "images", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeBase = file.originalname
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40) || "recipe";
    cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase() || ".jpg"}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }
    cb(null, true);
  },
});

// Recipe data
const recipes = [
  {
    id: 1,
    name: "Creamy Garlic Pasta",
    description: "Rich and creamy pasta with fresh garlic and parmesan.",
    longDescription: "A rich and comforting pasta dish made with garlic, cream, and parmesan cheese — perfect for an easy weeknight meal.",
    time: "20 min",
    serves: "2-3",
    rating: "4.8",
    reviews: 78,
    category: "Pasta",
    image: "images/creamy-garlic-pasta.jpg",
    ingredients: [
      "8 oz spaghetti or fettuccine",
      "2 tbsp butter",
      "4 cloves garlic, minced",
      "1 cup heavy cream",
      "¾ cup grated parmesan cheese",
      "Salt and pepper to taste",
      "Fresh parsley (optional)"
    ],
    instructions: [
      "Cook pasta according to package instructions and set aside.",
      "Melt butter in a pan over medium heat and sauté garlic until fragrant.",
      "Add heavy cream and simmer for 2-3 minutes.",
      "Stir in parmesan cheese until melted and smooth. Season with salt and pepper to taste."
    ]
  },
  {
    id: 2,
    name: "Easy Pancakes",
    description: "Light, fluffy pancakes perfect for a weekend breakfast.",
    longDescription: "Light, fluffy pancakes that come together in minutes — perfect for a relaxed weekend breakfast or a quick weekday treat.",
    time: "15 min",
    serves: "2-4",
    rating: "5.0",
    reviews: 134,
    category: "Breakfast",
    image: "images/pancakes.jpg",
    ingredients: [
      "1 cup all-purpose flour",
      "1 tbsp sugar",
      "1 tsp baking powder",
      "½ tsp baking soda",
      "½ tsp salt",
      "1 cup buttermilk",
      "1 egg",
      "2 tbsp melted butter",
      "Maple syrup and fresh fruit to serve"
    ],
    instructions: [
      "Whisk together flour, sugar, baking powder, baking soda, and salt in a large bowl.",
      "In a separate bowl, whisk buttermilk, egg, and melted butter together.",
      "Pour the wet ingredients into the dry ingredients and stir until just combined — a few lumps are fine. Do not overmix.",
      "Heat a non-stick skillet or griddle over medium heat and lightly grease with butter.",
      "Pour about ¼ cup of batter per pancake. Cook until bubbles form on the surface, then flip and cook 1-2 more minutes. Serve with maple syrup and fruit."
    ]
  },
  {
    id: 3,
    name: "Chicken Stir-Fry",
    description: "Quick and healthy stir-fry packed with colorful vegetables.",
    longDescription: "Quick and healthy stir-fry packed with tender chicken and colorful vegetables in a savory soy-ginger sauce.",
    time: "25 min",
    serves: "2-3",
    rating: "4.7",
    reviews: 65,
    category: "Chicken",
    image: "images/chicken-stir-fry.jpg",
    ingredients: [
      "2 chicken breasts, thinly sliced",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tbsp vegetable oil",
      "1 tsp fresh ginger, grated",
      "2 cloves garlic, minced",
      "1 bell pepper, sliced",
      "1 cup broccoli florets",
      "1 medium carrot, julienned",
      "2 tbsp oyster sauce",
      "Cooked rice to serve"
    ],
    instructions: [
      "Toss sliced chicken with soy sauce and sesame oil. Let marinate for 10 minutes.",
      "Heat vegetable oil in a wok or large skillet over high heat until very hot.",
      "Cook chicken in a single layer for 3-4 minutes until golden. Remove and set aside.",
      "In the same pan, stir-fry garlic and ginger for 30 seconds, then add all vegetables and cook 3-4 minutes until tender-crisp.",
      "Return chicken to the pan, add oyster sauce, and toss everything together. Serve immediately over rice."
    ]
  },
  {
    id: 4,
    name: "Cheesy Baked Ziti",
    description: "Hearty baked pasta layered with ricotta, marinara, and melted mozzarella.",
    longDescription: "Hearty baked pasta layered with ricotta, marinara, and bubbling mozzarella — the ultimate comfort food for any night of the week.",
    time: "45 min",
    serves: "4-6",
    rating: "4.8",
    reviews: 91,
    category: "Pasta",
    image: "images/cheesy-baked-ziti.jpg",
    ingredients: [
      "12 oz ziti pasta",
      "2 cups marinara sauce",
      "1 cup ricotta cheese",
      "2 cups shredded mozzarella, divided",
      "½ cup grated parmesan",
      "1 egg",
      "1 tsp Italian seasoning",
      "Salt and pepper to taste",
      "Fresh basil to garnish"
    ],
    instructions: [
      "Preheat oven to 375°F. Cook ziti according to package directions until just al dente. Drain and set aside.",
      "In a bowl, mix ricotta, egg, half the mozzarella, parmesan, Italian seasoning, salt, and pepper.",
      "Spread a thin layer of marinara in the bottom of a 9x13 baking dish.",
      "Toss cooked ziti with remaining marinara and ricotta mixture. Transfer to the baking dish.",
      "Top with remaining mozzarella and bake uncovered for 25 minutes until golden and bubbling. Garnish with fresh basil."
    ]
  },
  {
    id: 5,
    name: "Caprese Salad",
    description: "Fresh mozzarella, ripe tomatoes, and basil drizzled with olive oil.",
    longDescription: "Fresh mozzarella, ripe tomatoes, and fragrant basil drizzled with olive oil and balsamic — simple, elegant, and ready in minutes.",
    time: "10 min",
    serves: "2-4",
    rating: "4.6",
    reviews: 47,
    category: "Lunch",
    image: "images/caprese-salad.jpg",
    ingredients: [
      "3 large ripe tomatoes, sliced",
      "8 oz fresh mozzarella, sliced",
      "1 bunch fresh basil leaves",
      "3 tbsp extra-virgin olive oil",
      "2 tbsp balsamic glaze",
      "Flaky sea salt to taste",
      "Freshly cracked black pepper"
    ],
    instructions: [
      "Arrange alternating slices of tomato and mozzarella in a slightly overlapping row on a serving plate.",
      "Tuck fresh basil leaves between each slice.",
      "Drizzle generously with extra-virgin olive oil and balsamic glaze.",
      "Finish with flaky sea salt and freshly cracked black pepper. Serve immediately."
    ]
  },
  {
    id: 6,
    name: "Lemon Garlic Shrimp",
    description: "Tender shrimp sautéed in a bright lemon garlic butter sauce.",
    longDescription: "Tender shrimp sautéed in a bright lemon garlic butter sauce — on the table in 15 minutes and impressive enough for guests.",
    time: "15 min",
    serves: "2-3",
    rating: "4.9",
    reviews: 102,
    category: "Quick & Easy",
    image: "images/lemon-garlic-shrimp.jpg",
    ingredients: [
      "1 lb large shrimp, peeled and deveined",
      "3 tbsp butter",
      "4 cloves garlic, minced",
      "Juice of 1 lemon",
      "1 tsp lemon zest",
      "¼ tsp red pepper flakes",
      "Salt and pepper to taste",
      "2 tbsp fresh parsley, chopped",
      "Crusty bread or pasta to serve"
    ],
    instructions: [
      "Pat shrimp dry with paper towels and season with salt and pepper.",
      "Melt butter in a large skillet over medium-high heat. Add garlic and red pepper flakes and cook for 1 minute until fragrant.",
      "Add shrimp in a single layer. Cook 1-2 minutes per side until pink and opaque.",
      "Squeeze lemon juice over the shrimp and add lemon zest. Toss to coat.",
      "Garnish with fresh parsley and serve immediately with crusty bread or over pasta."
    ]
  },
  {
    id: 7,
    name: "Chocolate Chip Cookies",
    description: "Soft and chewy cookies loaded with melty chocolate chips.",
    longDescription: "Perfectly soft and chewy cookies with crisp golden edges and pools of melty chocolate — the only recipe you'll ever need.",
    time: "25 min",
    serves: "~24 cookies",
    rating: "5.0",
    reviews: 210,
    category: "Desserts",
    image: "images/chocolate-chip-cookies.jpg",
    ingredients: [
      "2¼ cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup (2 sticks) butter, softened",
      "¾ cup granulated sugar",
      "¾ cup packed brown sugar",
      "2 large eggs",
      "2 tsp vanilla extract",
      "2 cups chocolate chips"
    ],
    instructions: [
      "Preheat oven to 375°F. Whisk together flour, baking soda, and salt in a bowl and set aside.",
      "Beat butter, granulated sugar, and brown sugar together until light and fluffy, about 3 minutes.",
      "Add eggs one at a time, beating after each addition. Mix in vanilla extract.",
      "Gradually mix in the flour mixture until just combined, then fold in chocolate chips.",
      "Drop rounded tablespoons of dough onto ungreased baking sheets. Bake 9-11 minutes until golden. Cool on the pan for 2 minutes before transferring."
    ]
  },
  {
    id: 8,
    name: "Vegetable Stir-Fry",
    description: "Savory mix of fresh vegetables tossed in a light soy ginger sauce.",
    longDescription: "A colorful mix of fresh vegetables tossed in a light soy ginger sauce — a great meatless weeknight meal ready in 15 minutes.",
    time: "15 min",
    serves: "2-3",
    rating: "4.6",
    reviews: 58,
    category: "Vegetarian",
    image: "images/vegetable-stir-fry.jpg",
    ingredients: [
      "1 cup broccoli florets",
      "1 red bell pepper, sliced",
      "1 cup snap peas",
      "1 medium carrot, julienned",
      "1 cup mushrooms, sliced",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tsp fresh ginger, grated",
      "2 cloves garlic, minced",
      "1 tbsp cornstarch mixed with 2 tbsp water",
      "Cooked rice or noodles to serve"
    ],
    instructions: [
      "Mix soy sauce, sesame oil, ginger, garlic, and cornstarch slurry together in a small bowl to make the sauce.",
      "Heat a wok or large skillet over high heat until very hot. Add a drizzle of oil.",
      "Add the harder vegetables first (carrots, broccoli) and stir-fry for 2 minutes.",
      "Add bell pepper, snap peas, and mushrooms. Cook another 2-3 minutes until tender-crisp.",
      "Pour the sauce over the vegetables and toss to coat. Cook 1 more minute until the sauce thickens. Serve over rice or noodles."
    ]
  },
  {
    id: 9,
    name: "Tuscan Chicken",
    description: "Creamy sun-dried tomato chicken with spinach and parmesan.",
    longDescription: "Pan-seared chicken smothered in a rich creamy sauce with sun-dried tomatoes, spinach, and parmesan — restaurant quality in 30 minutes.",
    time: "30 min",
    serves: "3-4",
    rating: "4.8",
    reviews: 83,
    category: "Chicken",
    image: "images/tuscan-chicken.jpg",
    ingredients: [
      "4 chicken breasts",
      "1 tbsp olive oil",
      "3 cloves garlic, minced",
      "½ cup sun-dried tomatoes, drained and sliced",
      "1 cup heavy cream",
      "½ cup chicken broth",
      "½ cup grated parmesan",
      "2 cups fresh spinach",
      "1 tsp Italian seasoning",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Season chicken breasts with salt, pepper, and Italian seasoning. Heat olive oil in a large skillet over medium-high heat.",
      "Sear chicken 5-6 minutes per side until golden and cooked through. Remove from pan and set aside.",
      "In the same pan, sauté garlic for 1 minute, then add sun-dried tomatoes and cook 1 more minute.",
      "Pour in chicken broth and heavy cream. Bring to a simmer, then stir in parmesan until smooth.",
      "Add spinach and stir until wilted. Return chicken to the pan and spoon sauce over the top. Serve with pasta or crusty bread."
    ]
  },
  {
    id: 10,
    name: "Chicken Rice Bowl",
    description: "Seasoned chicken over fluffy rice with fresh toppings and savory sauce.",
    longDescription: "Seasoned chicken over fluffy rice with fresh toppings and a savory sauce — a balanced and satisfying dinner any night of the week.",
    time: "25 min",
    serves: "2-3",
    rating: "4.7",
    reviews: 119,
    category: "Dinner",
    image: "images/chicken-rice.jpg",
    ingredients: [
      "2 chicken breasts, sliced",
      "1 cup long-grain white rice",
      "2 tbsp soy sauce",
      "1 tbsp honey",
      "1 tsp garlic powder",
      "1 tbsp vegetable oil",
      "1 cucumber, sliced",
      "1 avocado, sliced",
      "2 green onions, chopped",
      "Sesame seeds to garnish"
    ],
    instructions: [
      "Cook rice according to package directions and keep warm.",
      "Mix soy sauce, honey, and garlic powder in a small bowl to make the glaze.",
      "Heat oil in a skillet over medium-high heat. Cook chicken slices 3-4 minutes per side until cooked through.",
      "Pour the glaze over the chicken in the final minute of cooking and toss to coat.",
      "Divide rice into bowls, top with glazed chicken, cucumber, avocado, green onions, and a sprinkle of sesame seeds."
    ]
  }
];

const recipeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(5).max(300).required(),
  longDescription: Joi.string().max(600).optional().allow(""),
  time: Joi.string().min(2).max(50).required(),
  serves: Joi.string().min(1).max(30).required(),
  rating: Joi.string().pattern(/^\d(\.\d)?$/).optional().default("0.0"),
  reviews: Joi.number().integer().min(0).optional().default(0),
  category: Joi.string()
    .valid("Breakfast", "Lunch", "Dinner", "Pasta", "Chicken", "Vegetarian", "Soups", "Quick & Easy", "Desserts")
    .required(),
  image: Joi.string().optional().allow(""),
  ingredients: Joi.array().items(Joi.string().min(1)).min(1).required(),
  instructions: Joi.array().items(Joi.string().min(1)).min(1).required(),
});

// Accept ingredients/instructions as JSON strings when sent via multipart/form-data
function normalizeRecipeBody(body) {
  const out = { ...body };
  for (const key of ["ingredients", "instructions"]) {
    if (typeof out[key] === "string") {
      try {
        const parsed = JSON.parse(out[key]);
        if (Array.isArray(parsed)) out[key] = parsed;
      } catch (_) {
        out[key] = out[key].split("\n").map((l) => l.trim()).filter(Boolean);
      }
    }
  }
  if (typeof out.reviews === "string" && out.reviews !== "") {
    const n = Number(out.reviews);
    if (!Number.isNaN(n)) out.reviews = n;
  }
  return out;
}

function deleteUploadedFile(filename) {
  if (!filename) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  fs.unlink(filePath, () => {});
}

// GET all recipes
app.get("/api/recipes", (req, res) => {
  res.json(recipes);
});

// GET single recipe by id
app.get("/api/recipes/:id", (req, res) => {
  const recipe = recipes.find((r) => r.id === parseInt(req.params.id));
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  res.json(recipe);
});

// POST a new recipe (optionally with an uploaded image)
app.post("/api/recipes", upload.single("image"), (req, res) => {
  const body = normalizeRecipeBody(req.body);
  const { error, value } = recipeSchema.validate(body, { abortEarly: false });
  if (error) {
    if (req.file) deleteUploadedFile(req.file.filename);
    return res.status(400).json({
      success: false,
      errors: error.details.map((d) => d.message),
    });
  }

  const imagePath = req.file
    ? `images/uploads/${req.file.filename}`
    : value.image || "images/hero.jpg";

  const newRecipe = {
    id: recipes.length > 0 ? Math.max(...recipes.map((r) => r.id)) + 1 : 1,
    name: value.name,
    description: value.description,
    longDescription: value.longDescription || value.description,
    time: value.time,
    serves: value.serves,
    rating: value.rating,
    reviews: value.reviews ?? 0,
    category: value.category,
    image: imagePath,
    ingredients: value.ingredients,
    instructions: value.instructions,
  };

  recipes.push(newRecipe);
  res.status(201).json({ success: true, recipe: newRecipe });
});

// PUT - edit an existing recipe
app.put("/api/recipes/:id", upload.single("image"), (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) {
    if (req.file) deleteUploadedFile(req.file.filename);
    return res.status(404).json({ success: false, error: "Recipe not found" });
  }

  const body = normalizeRecipeBody(req.body);
  const { error, value } = recipeSchema.validate(body, { abortEarly: false });
  if (error) {
    if (req.file) deleteUploadedFile(req.file.filename);
    return res.status(400).json({
      success: false,
      errors: error.details.map((d) => d.message),
    });
  }

  const oldImage = recipe.image;
  recipe.name = value.name;
  recipe.description = value.description;
  recipe.longDescription = value.longDescription || value.description;
  recipe.time = value.time;
  recipe.serves = value.serves;
  recipe.rating = value.rating;
  recipe.reviews = value.reviews ?? recipe.reviews;
  recipe.category = value.category;
  recipe.ingredients = value.ingredients;
  recipe.instructions = value.instructions;

  if (req.file) {
    recipe.image = `images/uploads/${req.file.filename}`;
    if (oldImage && oldImage.startsWith("images/uploads/")) {
      deleteUploadedFile(oldImage.replace("images/uploads/", ""));
    }
  } else if (value.image) {
    recipe.image = value.image;
  }

  res.status(200).json({ success: true, recipe });
});

// DELETE - remove a recipe
app.delete("/api/recipes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Recipe not found" });
  }

  const [removed] = recipes.splice(index, 1);
  if (removed.image && removed.image.startsWith("images/uploads/")) {
    deleteUploadedFile(removed.image.replace("images/uploads/", ""));
  }
  res.status(200).json({ success: true, recipe: removed });
});

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err?.message?.includes("images are allowed")) {
    return res.status(400).json({ success: false, errors: [err.message] });
  }
  next(err);
});

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
