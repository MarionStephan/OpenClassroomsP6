const Sauce = require('../models/Sauce');
const fs = require('fs');

// Créer une nouvelle sauce
exports.createSauce = (req, res, next) => {
    // Récupérer l'objet sauce depuis le corps de la requête
    const sauceObject = JSON.parse(req.body.sauce);

    // Supprimer les propriétés inutiles (_id, _userId)
    delete sauceObject._id;
    delete sauceObject._userId;

    // Créer une nouvelle instance de Sauce avec les données de la requête
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    // Enregistrer la sauce dans la base de données
    sauce.save()
        .then(() => {
            // Retourner une réponse en cas de succès
            res.status(201).json({ message: "Sauce ajoutée !" });
        })
        .catch(error => {
            // Retourner une réponse en cas d'erreur
            res.status(400).json({ error });
        });
};

// Modifier une sauce existante
exports.modifySauce = (req, res, next) => {
    // Rechercher la sauce correspondante dans la base de données
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            // Vérifier si l'utilisateur est autorisé à modifier la sauce
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                let sauceObject = {};

                if (req.file) {
                    // Si une nouvelle image est fournie, supprimer l'ancienne image
                    const filename = sauce.imageUrl.split("/images/")[1];
                    fs.unlink(`images/${filename}`, (error) => {
                        if (error) {
                            console.log('Erreur lors de la suppression de l\'image', error);
                        }
                    });

                    // Mettre à jour les données de la sauce avec la nouvelle image
                    sauceObject = {
                        ...JSON.parse(req.body.sauce),
                        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
                    };
                } else {
                    // Si aucune nouvelle image n'est fournie, simplement mettre à jour les autres données de la sauce
                    sauceObject = { ...req.body };
                }

                delete sauceObject._userId;

                // Mettre à jour la sauce dans la base de données
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

// Supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    // Rechercher la sauce correspondante dans la base de données
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            // Vérifier si l'utilisateur est autorisé à supprimer la sauce
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    // Supprimer la sauce de la base de données
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Sauce supprimée !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

// Obtenir toutes les sauces
exports.getAllSauces = (req, res, next) => {
    // Trouver toutes les sauces dans la base de données
    Sauce.find()
        .then((sauces) => {
            // Retourner les sauces trouvées
            res.status(200).json(sauces);
        })
        .catch((error) => {
            // Retourner une réponse en cas d'erreur
            res.status(400).json({ error });
        });
};

// Obtenir une sauce spécifique
exports.getOneSauce = (req, res, next) => {
    // Rechercher la sauce correspondante dans la base de données
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            // Retourner la sauce trouvée
            res.status(200).json(sauce);
        }
    ).catch(
        (error) => {
            // Retourner une réponse en cas d'erreur
            res.status(404).json({
                error: error
            });
        }
    );
};

// Ajouter ou supprimer un like/dislike pour une sauce
exports.likeOrDislike = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const likeValue = req.body.like;

    // Rechercher la sauce correspondante dans la base de données
    Sauce.findById(sauceId)
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({ message: 'Sauce non trouvée' });
            }

            let message = '';

            switch (likeValue) {
                case -1:
                    // Dislike
                    const dislikedUser = sauce.usersDisliked.indexOf(userId);

                    if (dislikedUser !== -1) {
                        message = 'Vous ne pouvez pas disliker plusieurs fois !';
                    }
                    else {
                        sauce.dislikes++;
                        sauce.usersDisliked.push(userId);
                        message = 'Votre dislike a bien été pris en compte !';
                    }

                    break;

                case 0:
                    // Retirer le like ou le dislike
                    const likedIndex = sauce.usersLiked.indexOf(userId);
                    const dislikedIndex = sauce.usersDisliked.indexOf(userId);

                    if (likedIndex !== -1) {
                        sauce.likes--;
                        sauce.usersLiked.splice(likedIndex, 1);
                        message = 'Votre avis a bien été modifié !';
                    } else if (dislikedIndex !== -1) {
                        sauce.dislikes--;
                        sauce.usersDisliked.splice(dislikedIndex, 1);
                        message = 'Votre avis a bien été modifié !';
                    }
                    break;

                case 1:
                    // Like
                    const likedUser = sauce.usersLiked.indexOf(userId);

                    if (likedUser !== -1) {
                        message = 'Vous ne pouvez pas liker plusieurs fois !';
                    } else {
                        sauce.likes++;
                        sauce.usersLiked.push(userId);
                        message = 'Votre like a bien été pris en compte !';
                    }

                    break;

                default:
                    return res.status(400).json({ message: 'Valeur non valide pour like' });
            }

            // Sauvegarder les modifications de la sauce dans la base de données
            sauce.save()
                .then(() => res.status(200).json({ message }))
                .catch((error) => res.status(500).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
};