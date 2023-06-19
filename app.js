const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
const app = express();
const path = require('path');
const Sauce = require('./models/Sauce');
const sauceRoutes = require('./routes/sauce');

mongoose.connect('mongodb+srv://Marion:MotDePasse@cluster0.cahhzo4.mongodb.net/?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


app.get('/localhost:3000/api', function (req, res) {
  res.send("Hello from the root application URL");
});


app.listen(0, () => console.log('Application is running'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});


app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/auth', userRoutes);
app.use('/api/sauce', sauceRoutes);

module.exports = app;