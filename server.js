const express = require('express');
require('dotenv').config();
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;
const percentile = require('stats-percentile');
const pg = require('pg');
const methodOverride = require('method-override');

const app = express();

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');


//Global Constant
const latestRoundsPosition = 4;
const ***REMOVED*** = [
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***ot_sam',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***'
];


//Query Constants

// const roundResolve = round => `{rounds(number: ${round}) { resolveTime }}`;
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
app.post('/user', getUserName);
app.post('/newuser', createNewUser);
app.get('/detail/:user', getModelDetails);
app.get('/percent', getPercentile);
app.get('/horseracemobile', getHorsePage);
app.put('/:username/addmodel', userAddModel);
app.put('/:username/removemodel',userRemoveModel);

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

//Helper Functions
const sortUsersCorr = (leftModel, rightModel) =>{
  if(leftModel.correlation < rightModel.correlation){
    return -1;
  }else if(leftModel.correlation > rightModel.correlation){
    return 1;
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

//90th percentile function
function p90(arr){
  const ninety = percentile(arr, 90);
  return ninety;
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
  // console.log(returnedInfo);
  return returnedInfo;
}

//Function for retrieving a percentile number and comparing models to establish > than percentile models
async function getPercentile(roundNumber, modelArr){
  const roundBoard = await retrieveObject(v2RoundDetails(roundNumber));
  const userPerformanceArr = roundBoard.v2RoundDetails.userPerformances;
  const endDate = userPerformanceArr[0].date;
  const filteredArr = userPerformanceArr.filter(user => user.date === endDate);
  const corrArr = filteredArr.map(user => user.correlation);
  const ninentyPercentile = p90(corrArr);
  const ***REMOVED***ModelArr = filteredArr.filter(user => modelArr.includes(user.username));
  console.log(roundNumber);
  const ***REMOVED***Ninety = ***REMOVED***ModelArr.filter(user => user.correlation > ninentyPercentile);
  ***REMOVED***Ninety.sort(sortUsersCorr);
  ***REMOVED***Ninety.forEach(user => console.log(`${user.username}: ${user.correlation.toFixed(3)}`));
  console.log(***REMOVED***Ninety.length);
}

//Individual user profile information retrieval
async function horse_race(username){
  const user = await retrieveObject(userProfile(username));
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
  // console.log(user.v2UserProfile.dailyUserPerformances[0]);
  // console.log(user.v2UserProfile.latestRoundPerformances.slice(-4));
  return[userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange];
}


//Homepage Route Function
function getHomepage(req, res){
  res.render('pages/home.ejs', {userExist: 'none'});
}

function getUserName(req, res){
  // console.log(req.body.username);
  client.query(`SELECT * FROM userProfile WHERE username = '${req.body.username}'`)
    .then(result =>{
      // console.log(result.rows[0]);
      if(result.rows[0] === undefined){
        res.render('pages/home.ejs', {userExist: 'no'});
      }else{
        res.redirect(`/detail/${req.body.username}`);
      }
    });
}

function createNewUser(req, res){
  client.query(`SELECT * FROM userProfile WHERE username = '${req.body.username}'`)
    .then(result =>{
      if(result.rows[0] !== undefined){
        res.render('pages/home.ejs', {userExist: 'yes'});
      }else{
        client.query(`INSERT INTO userProfile (username, models) VALUES('${req.body.username}', ARRAY ['${req.body.model}'])`)
          .then(() => {
            res.redirect(`/detail/${req.body.username}`);
          });
      }
    });
}

async function retrieveUserModels(user){
  let modelArr = [];
  await client.query(`SELECT * FROM userProfile WHERE username = '${user}' `)
    .then(result => {
      console.log(result.rows[0]);
      modelArr = result.rows[0].models;
      // console.log(modelArr);
      return modelArr;
    });
  return modelArr;
}

//Model Detail Page
async function getModelDetails(req,res){
  const username = req.params.user;
  const modelArr = await retrieveUserModels(username);
  // console.log(modelArr);
  const ***REMOVED*** = await multiHorse(modelArr);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = ***REMOVED***[0].activeRounds[3].date.substring(0,10);

  res.render('pages/userDetails.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: ***REMOVED***, date: date, username: username});
}

async function multiHorse(arr){
  let ***REMOVED*** = [];
  for(let i = 0; i < arr.length; i++){
    const user = await retrieveObject(userProfile(arr[i]));
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
    // console.log(user.v2UserProfile.dailyUserPerformances[0]);
    // console.log(user.v2UserProfile.latestRoundPerformances.slice(-4));
    ***REMOVED***.push(new UserDetail(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
  }
  return ***REMOVED***;
}
//Horse Race Page function
async function getHorsePage(req,res){
  const ***REMOVED*** = await multiHorse(***REMOVED***);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = ***REMOVED***[0].activeRounds[3].date.substring(0,10);
  // console.log(***REMOVED***[0].activeRounds.length);
  // console.log(***REMOVED***[5]);
  // console.log(***REMOVED***.slice(0,15));
  // console.log(***REMOVED***.slice(15,25));
  // console.log(***REMOVED***.slice(25,40));
  // console.log(***REMOVED***);
  // console.log(currentNmr);
  // console.log(latestRounds);
  res.render('pages/horse.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: ***REMOVED***, date: date});
}

async function userAddModel(req, res){
  const username = req.params.username;
  const newModel = req.body.model;
  await client.query(`UPDATE userProfile SET models = models || '{${newModel}}' WHERE username = '${username}'`);
  res.redirect(`/detail/${username}`);
}

async function userRemoveModel(req, res){
  const username = req.params;
  const removeModel = req.body.model;
  await client.query(`UPDATE userProfile SET models = array_remove(models, '${removeModel}')`);
  res.redirect(`/detail/${username}`);
}

// Function to retrieve list of all users from leaderboard
async function getUsers(){
  const leaderboard = await retrieveObject(v2Leaderboard());
  const leaderboardUsers = leaderboard.v2Leaderboard;
  let users = leaderboardUsers.map(user => user.username);
  // console.log(users);
  return users;
}

// Function for retrieving mmc of a user
async function userProfileMmc(username, round){
  const user = await retrieveObject(userProfile(username));
  // console.log(user);
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
  // console.log(filteredMmcArr);
  // console.log(modelMmcArr);
  const ninentyPercentile = p90(filteredMmcArr);
  console.log(round);
  const ***REMOVED***Ninety = modelMmcArr.filter(user => user.mmc > ninentyPercentile);
  ***REMOVED***Ninety.sort(sortUsersMmc);
  ***REMOVED***Ninety.forEach(user => console.log(`${user.username}: ${user.mmc.toFixed(3)}`));
  console.log(***REMOVED***Ninety.length);
}


//Executable functions
// userProfileMmc('***REMOVED***', 239);
// getHorsePage(***REMOVED***);
// calculateRoundInfo(238, ***REMOVED***);
// calculateRoundInfo(239, ***REMOVED***);
// calculateRoundInfo(240, ***REMOVED***);
// calculateRoundInfo(241, ***REMOVED***);
// getUsers();
// getPercentile(238, ***REMOVED***);
// getPercentile(239, ***REMOVED***);
// getPercentile(240, ***REMOVED***);
// getPercentile(241, ***REMOVED***);
// horse_race("***REMOVED***");
// retrieveObject(latestNmrPrice())
//   .then(result => console.log(result));


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

client.connect().then(() => {
  app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
});
