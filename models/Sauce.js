const mongoose = require('mongoose');

// Définition du schéma de Sauce
const sauceSchema = mongoose.Schema({
    userId: { type: String, required: true },              // Identifiant de l'utilisateur associé à la sauce
    name: { type: String, required: true },                // Nom de la sauce
    manufacturer: { type: String, required: true },        // Fabricant de la sauce
    description: { type: String, required: true },         // Description de la sauce
    mainPepper: { type: String, required: true },          // Principal ingrédient/poivre de la sauce
    imageUrl: { type: String, required: true },            // URL de l'image de la sauce
    heat: { type: Number, required: true },                // Niveau de piquant de la sauce (de 1 à 10)
    likes: { type: Number, default: 0 },                   // Nombre de likes de la sauce (par défaut 0)
    dislikes: { type: Number, default: 0 },                // Nombre de dislikes de la sauce (par défaut 0)
    usersLiked: { type: [String], default: [] },           // Liste des identifiants des utilisateurs ayant liké la sauce
    usersDisliked: { type: [String], default: [] }         // Liste des identifiants des utilisateurs ayant disliké la sauce
});

// Export du modèle de Sauce basé sur le schéma défini
module.exports = mongoose.model('Sauce', sauceSchema);
