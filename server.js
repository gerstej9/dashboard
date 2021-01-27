const express = require('express');
require('dotenv').config({});
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;
const percentile = require('stats-percentile');
const pg = require('pg');
const methodOverride = require('method-override');
const cookies = require('cookie-parser');

const app = express();

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(cookies());


//Global Constant
let modelFound = true;

//Query Constants

const latestNmrPrice = () => '{latestNmrPrice {lastUpdated PriceUSD}}';
const userProfile = username => `{v2UserProfile(username: "${username}") {
  latestRanks {
    mmcRank
    prevMmcRank
    prevRank
    rank
  }
  latestRoundPerformances {
    correlation
    correlationWithMetamodel
    date
    mmc
    payoutPending
    payoutSettled
    roundNumber
    roundResolved
    selectedStakeValue
    weekPayoutSelection
  }
  dailyUserPerformances {
    payoutPending
  }
  totalStake
  username
}}`;

const v2Leaderboard = () => `{v2Leaderboard{
  username
}
}`;

const v2RoundDetails = roundNumber => `{
  v2RoundDetails(roundNumber:${roundNumber}) {
    roundNumber
    userPerformances {
      correlation
      date
      username
    }
  }
}`;


// Route Paths
app.get('/', getHomepage);
app.get('/about_us', getAboutUs);
app.post('/user', getUserName);
app.get('/detail/:user', getModelDetails);
app.get('/percent', getPercentile);
app.get('/:user/modelcomparison', ModelComparison);
app.get('/:user/download', downloadSQL);

//Object constructor Function for User Detail
function UserDetail(mmcCurrent, mmcPrevRank, corrCurrent, corrPrev, activeRounds, totalStake, modelName, dailyChange){
  this.mmcCurrent = mmcCurrent;
  this.mmcPrevRank = mmcPrevRank;
  this.corrCurrent = corrCurrent;
  this.corrPrev = corrPrev;
  this.activeRounds = activeRounds;
  this.totalStake = totalStake;
  this.modelName = modelName;
  this.dailyChange = dailyChange;
}

function NewScore(model, corr, mmc, newscore, corrPassing, newScorePassing){
  this.model = model;
  this.corr = corr;
  this.mmc = mmc;
  this.newscore = newscore;
  this.corrPassing = corrPassing || false;
  this.newScorePassing = newScorePassing || false;

}


//Helper Functions
const sortUsersCorr = (leftModel, rightModel) =>{
  if(leftModel.corr < rightModel.corr){
    return 1;
  }else if(leftModel.corr > rightModel.corr){
    return -1;
  }else{
    return 0;
  }
};

const sortUsersMmc = (leftModel, rightModel) =>{
  if(leftModel.mmc < rightModel.mmc){
    return -1;
  }else if(leftModel.mmc > rightModel.mmc){
    return 1;
  }else{
    return 0;
  }
};

const sortUsersNewscore = (leftModel, rightModel) =>{
  if(leftModel.newscore < rightModel.newscore){
    return 1;
  }else if(leftModel.newscore > rightModel.newscore){
    return -1;
  }else{
    return 0;
  }
};

//percentile function
function percentileValue(arr, threshold){
  const ninety = percentile(arr, threshold);
  return ninety;
}

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

//Function for retrieving a percentile number and comparing models to establish > than percentile models
async function getPercentile(roundNumber, modelArr){
  const roundBoard = await retrieveObject(v2RoundDetails(roundNumber));
  const userPerformanceArr = roundBoard.v2RoundDetails.userPerformances;
  const endDate = userPerformanceArr[0].date;
  const filteredArr = userPerformanceArr.filter(user => user.date === endDate);
  const corrArr = filteredArr.map(user => user.correlation);
  const ninentyPercentile = percentileValue(corrArr, 80);
  const userModelArr = filteredArr.filter(user => modelArr.includes(user.username));
  const userNinety = userModelArr.filter(user => user.correlation > ninentyPercentile);
  userNinety.sort(sortUsersCorr);
  const userFinalArr = userNinety.map(model => model.username);
  return {value: ninentyPercentile, userArr: userFinalArr};
}


//Homepage Route Function
async function getHomepage(req, res){
  const queryLeaderboard = await retrieveObject(v2Leaderboard());
  const leaderboardTen = queryLeaderboard.v2Leaderboard.slice(0,10);
  const topTenArr = leaderboardTen.map(model => model.username);
  res.render('pages/home.ejs', {userExist: 'none', theme: getTheme(req), modelExistsUser: false, modelName: false, topTen: topTenArr});
}

function getAboutUs(req, res){
  res.render('pages/about_us.ejs', {theme: getTheme(req)});
}

function getUserName(req, res){
  client.query(`SELECT * FROM userProfile WHERE username = '${req.body.username}'`)
    .then(result =>{
      if(result.rows[0] === undefined){
        res.render('pages/home.ejs', {userExist: 'no', theme: getTheme(req)});
      }else{
        res.redirect(`/detail/${req.body.username}`);
      }
    });
}



//Model Detail Page
async function getModelDetails(req,res){
  let modelArray = req.query.model;
  if(typeof(modelArray) === 'string'){
    modelArray = [modelArray];
  }
  const username = req.params.user;
  modelFound = true;
  const userModelArr = await multiHorse(modelArray);
  if(userModelArr[0] === false){
    res.render('pages/home.ejs', {userExist: 'none', theme: getTheme(req), modelExistsUser: username, modelName: userModelArr[1], topTen: false});
  }else{
    const currentNmr = await retrieveObject(latestNmrPrice());
    const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
    const date = userModelArr[0].activeRounds[3].date.substring(0,10);
    res.render('pages/userDetails.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userModelArr, date: date, username: username, modelFound: modelFound, theme: getTheme(req)});
  }
}

async function multiHorse(arr){
  let userModelArr = [];
  for(let i = 0; i < arr.length; i++){
    try{
      const user = await retrieveObject(userProfile(arr[i].toLowerCase()));
      const [userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange] =
      [
        user.v2UserProfile.latestRanks.mmcRank,
        user.v2UserProfile.latestRanks.prevMmcRank,
        user.v2UserProfile.latestRanks.rank,
        user.v2UserProfile.latestRanks.prevRank,
        user.v2UserProfile.latestRoundPerformances.slice(-4),
        Number(user.v2UserProfile.totalStake).toFixed(2),
        user.v2UserProfile.username,
        Number(user.v2UserProfile.dailyUserPerformances[0].payoutPending).toFixed(2)
      ];
      userModelArr.push(new UserDetail(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
    }
    catch(error){
      userModelArr = [false, arr[i]];
    }
  }
  return userModelArr;
}

async function ModelComparison(req, res){
  const username = req.params.user;
  let modelArray = req.query.model;
  if(typeof(modelArray) === 'string'){
    modelArray = [modelArray];
  }
  const userModelArr = await multiHorse(modelArray);
  const date = userModelArr[0].activeRounds[0].date.substring(0,10);
  const round = userModelArr[0].activeRounds[0].roundNumber;
  const percentile = 80;
  let userPercentile = await getPercentile(round, modelArray);
  let newScoreArr = userModelArr.map(model => {
    let modelName = model.modelName;
    let mmc = model.activeRounds[0].mmc;
    let corr = model.activeRounds[0].correlation;
    let newscore = Number(mmc)+Number(corr);
    return new NewScore(modelName, corr, mmc, newscore);
  });
  let sortedArray = newScoreArr.sort(sortUsersCorr);
  client.query(`DELETE FROM ModelData WHERE round = ${round} AND username = '${username}'`);
  sortedArray.forEach(model =>{
    if(userPercentile.userArr.includes(model.model)){
      model.corrPassing = true;
    }
    client.query(`INSERT INTO ModelData (username, round, model, corr, percentileAllModelCorr, passingPercentile, percentileValue, mmc, newscore) VALUES('${username}','${round}', '${model.model}', '${model.corr}', '${percentile}', '${model.corrPassing}', '${userPercentile.value}', '${model.mmc}', '${model.newscore}')`);
  });
  const topPercentileArr = sortedArray.filter(model => model.corrPassing === true);
  const bottomArr = sortedArray.filter(model => model.corrPassing === false);
  res.render('pages/newscore.ejs', {userData: bottomArr, ninetyModelArr: topPercentileArr, date: date, round: round, theme: getTheme(req)});
}

async function downloadSQL(req, res){
  const username = req.params.user;
  const result = await client.query(`SELECT round, model, corr, percentileAllModelCorr, passingPercentile, percentileValue, mmc, newscore FROM ModelData WHERE username = '${username}'`);
  const rows = result.rows;
  console.log(rows);
  const headerRow = '"round","model","corr","percentile","passing percentile","percentile value","mmc","newscore"\r\n';
  const dataRows = rows.reduce(function (csvDataString, row) {
    csvDataString += `"${row.round}","${row.model}","${row.corr}","${row.percentileallmodelcorr}","${row.passingpercentile}","${row.percentilevalue}","${row.mmc}","${row.newscore}"`;
    csvDataString += '\r\n';
    return csvDataString;
  }, '');
  res.header('Content-Type', 'text/csv');
  res.attachment('numerai_model_comparison.csv');
  return res.send(headerRow + dataRows);
}



// Function to retrieve list of all users from leaderboard
async function getUsers(){
  const leaderboard = await retrieveObject(v2Leaderboard());
  const leaderboardUsers = leaderboard.v2Leaderboard;
  let users = leaderboardUsers.map(user => user.username);
  return users;
}

// Function for retrieving mmc of a user
async function userProfileMmc(username, round){
  const user = await retrieveObject(userProfile(username));
  const userRounds = user.v2UserProfile.latestRoundPerformances;
  const mmcRound = userRounds.filter(userRound => userRound.roundNumber === round);
  const targetMmc = mmcRound[0].mmc;
  return {username: username, mmc: targetMmc};
}


//Function for calculating mmc total per round for percentile gathering
async function calculateRoundInfo(round, modelArr){
  const users = await getUsers();
  console.log(users.length);
  let mmcArr = [];
  let modelMmcArr = [];
  for(let i = 0; i < 600; i++){
    const userMmc = await userProfileMmc(users[i], round);
    mmcArr.push(userMmc.mmc);
    if(modelArr.includes(userMmc.username)){
      modelMmcArr.push(userMmc);
    }
  }
  const filteredMmcArr = mmcArr.filter(m => m !== null);
  const ninentyPercentile = percentileValue(filteredMmcArr, 90);
  console.log(round);
  const userNinety = modelMmcArr.filter(user => user.mmc > ninentyPercentile);
  userNinety.sort(sortUsersMmc);
  userNinety.forEach(user => console.log(`${user.username}: ${user.mmc.toFixed(3)}`));
  console.log(userNinety.length);
}


//Executable functions
app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

client.connect().then(() => {
  app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
});







//Get every model for every round
//Get rid of rest of database
//Make model comparison dynamically rendered

// All Data
// round Number, model name, mmc, cor, stake, nmr PriceUSD

//TODO
//NEW postsgres table for historic graphql data
//2 approaches, query round details only allows for corr, model name and date,
//OR pull info from each user query
//Avg corr for all models across individual round
//Slope for each model over previous 12 closed rounds
//Add comments and rename variables to be clearer
//CSS
//Create Footer
//Render download entirely from js?
