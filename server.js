const express = require('express');
const app = express();
const PORT = process.env.PORT || 9999;

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.get('/', getHomepage);

function getHomepage(req, res){
  res.render('index.ejs');
}

app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));
app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
