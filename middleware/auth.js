const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        // Récupérer le token d'authentification du header de la requête
        const token = req.headers.authorization.split(' ')[1];

        // Décoder le token à l'aide de la clé secrète
        const decodedToken = jwt.verify(token, process.env.TOKEN);

        // Extraire l'identifiant de l'utilisateur du token décodé
        const userId = decodedToken.userId;

        // Ajouter l'identifiant de l'utilisateur à la requête pour une utilisation ultérieure
        req.auth = {
            userId: userId
        };

        // Vérifier si l'identifiant de l'utilisateur dans le corps de la requête correspond à l'identifiant du token décodé
        if (req.body.userId && req.body.userId !== userId) {
            throw ' 403: unauthorized request.';
        } else {
            // Passer au middleware suivant
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ error });
    }
};
