const express = require('express');
const mongoose = require('mongoose');
const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');
const rateLimit = require('express-rate-limit');

const path = require('path');
require('dotenv').config();

const app = express();
const helmet = require("helmet");

// Connexion à la base de données MongoDB
mongoose.connect(process.env.URL_BDD, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Configuration de l'application
app.use(express.json());

// Configuration des en-têtes CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Configuration de Helmet pour la sécurité
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Configuration de rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Nombre maximum de requêtes autorisées par fenêtre
  message: "Trop de requêtes effectuées. Veuillez réessayer plus tard.",
});
app.use(limiter);

// Gestion des images statiques
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes pour l'authentification
app.use('/api/auth', userRoutes);

// Routes pour les sauces
app.use('/api/sauces', sauceRoutes);

module.exports = app;
