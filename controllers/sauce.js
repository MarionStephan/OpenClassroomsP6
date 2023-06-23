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
    const { id } = req.params;
    const { userId } = req.auth;

    Sauce.findById(id)
        .then((sauce) => {
            if (!sauce) {
                return res.status(404).json({ message: 'Sauce not found' });
            }

            if (sauce.userId === userId) {
                return res.status(401).json({ message: "You can't like or dislike your own sauce" });
            }

            let message = '';

            if (sauce.usersLiked.includes(userId)) {
                const index = sauce.usersLiked.indexOf(userId);
                sauce.usersLiked.splice(index, 1);
                message = 'Sauce unliked';
            } else if (sauce.usersDisliked.includes(userId)) {
                const index = sauce.usersDisliked.indexOf(userId);
                sauce.usersDisliked.splice(index, 1);
                message = 'Sauce undisliked';
            } else {
                sauce.usersLiked.push(userId);
                message = 'Sauce liked';
            }

            sauce
                .save()
                .then(() => res.status(200).json({ message }))
                .catch((error) => res.status(500).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
};
