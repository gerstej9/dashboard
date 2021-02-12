const express = require('express');
require('dotenv').config({});
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;
const cookies = require('cookie-parser');
const app = express();


app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(cookies());


//Query Constants
const v2Leaderboard = () => `{v2Leaderboard{
  username
}
}`;


// Route Paths
app.get('/', getHomepage);
app.get('/about_us', getAboutUs);


//Helper Functions
function getTheme(req){
  return req.cookies.theme || 'light';
}

//Base api graphql call
async function retrieveObject(numquery){
  const returnedInfo =  await fetch('https://api-tournament.numer.ai/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: numquery})
  })
    .then(r => r.json())
    .then(data => data.data)
    .catch(error => console.error(error));
  return returnedInfo;
}


//Homepage Route Function
async function getHomepage(req, res){
  const queryLeaderboard = await retrieveObject(v2Leaderboard());
  const leaderboardTen = queryLeaderboard.v2Leaderboard.slice(0,10);
  const topTenArr = leaderboardTen.map(model => model.username);
  res.render('pages/home.ejs', {userExist: 'none', theme: getTheme(req), modelExistsUser: false, modelName: false, topTen: topTenArr});
}

//About Us Route Function
function getAboutUs(req, res){
  res.render('pages/about_us.ejs', {theme: getTheme(req)});
}


//Executable functions
app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

app.listen(PORT,() => console.log(`Listening on: ${PORT}`));

