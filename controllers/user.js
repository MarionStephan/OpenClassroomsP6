const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
var passwordValidator = require('password-validator');
require('dotenv').config();

// Créer un schéma pour la validation du mot de passe
var schema = new passwordValidator();

// Ajouter des propriétés au schéma
schema
    .is().min(8)                                    // Longueur minimale de 8 caractères
    .is().max(100)                                  // Longueur maximale de 100 caractères
    .has().uppercase()                              // Doit contenir des lettres majuscules
    .has().lowercase()                              // Doit contenir des lettres minuscules
    .has().digits(2)                                // Doit contenir au moins 2 chiffres
    .has().not().spaces()                           // Ne doit pas contenir d'espaces
    .is().not().oneOf(['MoDePasse', 'MotDePasse123']); // Liste noire de valeurs interdites

// Inscription d'un utilisateur
exports.signup = (req, res, next) => {
    // Hasher le mot de passe avec bcrypt
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });

            // Validation du mot de passe avec le schéma
            if (!schema.validate(req.body.password)) {
                console.log('Invalid password');
            } else {
                user.save()
                    .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};

// Connexion d'un utilisateur
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    // Générer un token JWT pour l'utilisateur
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.TOKEN,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};