const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: "Sauce ajoutée !" }) })
        .catch(error => { res.status(400).json({ error }) })
};

exports.modifySauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split("/images/")[1];
                fs.unlink(`images/${filename}`, (error) => {
                    if (error) {
                        console.log('Erreur lors de la suppression de l\'image', error);
                    } else {
                        const sauceObject = req.file ? {
                            ...JSON.parse(req.body.sauce),
                            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
                        } : { ...req.body };
                        delete sauceObject._userId;

                        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                            .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                            .catch(error => res.status(401).json({ error }));
                    }
                });
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};


exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
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

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => {
            res.status(200).json(sauces);
        }
        )
        .catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            res.status(200).json(sauce);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

exports.likeOrDislike = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const likeValue = req.body.like;

    Sauce.findById(sauceId)
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({ message: 'Sauce non trouvée' });
            }

            // Vérifier si l'utilisateur est le créateur de la sauce
            if (sauce.userId === userId) {
                return res.status(401).json({ message: "Vous ne pouvez pas liker ou disliker votre propre sauce" });
            }

            let message = '';

            switch (likeValue) {
                case -1:
                    // Dislike
                    sauce.dislikes++;
                    sauce.usersDisliked.push(userId);
                    message = 'Votre avis est bien pris en compte (dislike) !';
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
                    sauce.likes++;
                    sauce.usersLiked.push(userId);
                    message = 'Votre avis est bien pris en compte (like) !';
                    break;

                default:
                    return res.status(400).json({ message: 'Valeur non valide pour like' });
            }

            sauce.save()
                .then(() => res.status(200).json({ message }))
                .catch((error) => res.status(500).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
};

