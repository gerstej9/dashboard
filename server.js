const express = require('express');
require('dotenv').config();
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;

const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.get('/', getHomepage);

function getHomepage(req,res){
  const roundCloseDate =  retrieveObject(roundResolve(200));
  console.log(roundCloseDate);
  res.render('index.ejs', {roundCloseDate: roundCloseDate});
}

function roundResolve(round){
  return `{rounds(number: ${round}) { resolveTime }}`;
}

function retrieveObject(Numquery){
  const returnedInfo =  fetch('https://api-tournament.numer.ai/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: Numquery})
  })
    .then(r => r.json())
    .then(data => {console.log('data returned:', data.data);
    });
  return returnedInfo;
}


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
