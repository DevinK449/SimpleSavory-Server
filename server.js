const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose
  .connect("mongodb+srv://devink_db_user:WmOkAIdM604gy4C2@cluster0.repjbtw.mongodb.net/simplesavory?appName=Cluster0")
  .then(() => console.log("Connected to mongodb..."))
  .catch((err) => console.error("could not connect to mongodb...", err));

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

const recipeMongooseSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    longDescription: String,
    time: String,
    serves: String,
    rating: String,
    reviews: Number,
    category: String,
    image: String,
    ingredients: [String],
    instructions: [String],
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

const Recipe = mongoose.model("Recipe", recipeMongooseSchema);

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
app.get("/api/recipes", async (req, res) => {
  const recipes = await Recipe.find();
  res.json(recipes);
});

// GET single recipe by id
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(404).json({ error: "Recipe not found" });
  }
});

// POST a new recipe (optionally with an uploaded image)
app.post("/api/recipes", upload.single("image"), async (req, res) => {
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

  const newRecipe = new Recipe({
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
  });

  const saved = await newRecipe.save();
  res.status(201).json({ success: true, recipe: saved });
});

// PUT - edit an existing recipe
app.put("/api/recipes/:id", upload.single("image"), async (req, res) => {
  const existing = await Recipe.findOne({ _id: req.params.id }).catch(() => null);
  if (!existing) {
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

  const oldImage = existing.image;
  const fieldsToUpdate = {
    name: value.name,
    description: value.description,
    longDescription: value.longDescription || value.description,
    time: value.time,
    serves: value.serves,
    rating: value.rating,
    reviews: value.reviews ?? existing.reviews,
    category: value.category,
    ingredients: value.ingredients,
    instructions: value.instructions,
  };

  if (req.file) {
    fieldsToUpdate.image = `images/uploads/${req.file.filename}`;
    if (oldImage && oldImage.startsWith("images/uploads/")) {
      deleteUploadedFile(oldImage.replace("images/uploads/", ""));
    }
  } else if (value.image) {
    fieldsToUpdate.image = value.image;
  }

  await Recipe.updateOne({ _id: req.params.id }, fieldsToUpdate);
  const updated = await Recipe.findOne({ _id: req.params.id });
  res.status(200).json({ success: true, recipe: updated });
});

// DELETE - remove a recipe
app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const removed = await Recipe.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }
    if (removed.image && removed.image.startsWith("images/uploads/")) {
      deleteUploadedFile(removed.image.replace("images/uploads/", ""));
    }
    res.status(200).json({ success: true, recipe: removed });
  } catch (err) {
    res.status(404).json({ success: false, error: "Recipe not found" });
  }
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
