const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Définition du schéma de User
const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },   // Email de l'utilisateur (doit être unique)
    password: { type: String, required: true }               // Mot de passe de l'utilisateur
});

// Utilisation du plugin uniqueValidator pour valider l'unicité de l'email
userSchema.plugin(uniqueValidator);

// Export du modèle de User basé sur le schéma défini
module.exports = mongoose.model('User', userSchema);
