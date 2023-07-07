const multer = require('multer');

// Types de fichiers d'images acceptés et leurs extensions correspondantes
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// Configuration du stockage des fichiers avec multer
const storage = multer.diskStorage({
    // Destination où les fichiers téléchargés seront sauvegardés
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    // Génération du nom de fichier unique
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_'); // Remplacement des espaces par des underscores
        const extension = MIME_TYPES[file.mimetype]; // Obtenir l'extension du fichier à partir du type MIME
        callback(null, name + Date.now() + '.' + extension); // Concaténer le nom, la date actuelle et l'extension pour former le nom de fichier final
    }
});

// Exporter l'objet multer configuré pour gérer le téléchargement d'une seule image
module.exports = multer({ storage: storage }).single('image');
