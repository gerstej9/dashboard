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
const latestRoundsPosition = 4;
let modelFound = true;
// localStorage.setItem('modelCollections', modelCollections);


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
// app.post('/newuser', createNewUser);
app.get('/detail/:user', getModelDetails);
app.get('/percent', getPercentile);
// app.put('/:username/addmodel', userAddModel);
app.put('/:username/removemodel',userRemoveModel);
app.get('/:user/model_not_found', modelNotFound);
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
  const ninentyPercentile = percentileValue(corrArr, 80);
  const userModelArr = filteredArr.filter(user => modelArr.includes(user.username));
  // console.log(roundNumber);
  const userNinety = userModelArr.filter(user => user.correlation > ninentyPercentile);
  userNinety.sort(sortUsersCorr);
  const userFinalArr = userNinety.map(model => model.username);
  return {value: ninentyPercentile, userArr: userFinalArr};
}

//Individual user profile information retrieval
async function modelComp(username){
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
  res.render('pages/home.ejs', {userExist: 'none', theme: getTheme(req)});
}

function getUserName(req, res){
  // console.log(req.body.username);
  client.query(`SELECT * FROM userProfile WHERE username = '${req.body.username}'`)
    .then(result =>{
      // console.log(result.rows[0]);
      if(result.rows[0] === undefined){
        res.render('pages/home.ejs', {userExist: 'no', theme: getTheme(req)});
      }else{
        res.redirect(`/detail/${req.body.username}`);
      }
    });
}

// function createNewUser(req, res){
//   const theme = req.cookies.theme;
//   client.query(`SELECT * FROM userProfile WHERE username = '${req.body.username}'`)
//     .then(result =>{
//       if(result.rows[0] !== undefined){
//         res.render('pages/home.ejs', {userExist: 'yes', theme: theme});
//       }else{
//         client.query(`INSERT INTO userProfile (username, models) VALUES('${req.body.username}', ARRAY ['${req.body.model}'])`)
//           .then(() => {
//             res.redirect(`/detail/${req.body.username}`);
//           });
//       }
//     });
// }

// function createNewUser(req, res){
//   const newCollection = req.body.username;
//   const LSmodels = localStorage.getItem('modelCollections');
//   const modelCollections = JSON.parse(LSmodels);
//   if(modelCollections[0].collectionName === newCollection){
//     res.render('pages/home.ejs', {userExist: 'yes', theme: getTheme(req)});
//   }else{
//     res.cookie('username', `${newCollection}`);
//     res.redirect(`/detail/${newCollection}`);
//   }
// }

async function retrieveUserModels(user){
  let modelArr = [];
  await client.query(`SELECT * FROM userProfile WHERE username = '${user}' `)
    .then(result => {
      // console.log(result.rows[0]);
      modelArr = result.rows[0].models;
      // console.log(modelArr);
      return modelArr;
    });
  return modelArr;
}


//Model Detail Page
async function getModelDetails(req,res){
  const username = req.params.user;
  modelFound = true;
  const modelArr = await retrieveUserModels(username);
  // console.log(modelArr);
  const userModelArr = await multiHorse(modelArr);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = userModelArr[0].activeRounds[3].date.substring(0,10);
  res.render('pages/userDetails.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userModelArr, date: date, username: username, modelFound: modelFound, theme: getTheme(req)});
}

async function multiHorse(arr){
  let userModelArr = [];
  for(let i = 0; i < arr.length; i++){
    try{
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
      userModelArr.push(new UserDetail(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
    }
    catch(error){
      const [userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange] =
      [
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        0.00,
        arr[i],
        0.00
      ];
      // console.log(user.v2UserProfile.dailyUserPerformances[0]);
      // console.log(user.v2UserProfile.latestRoundPerformances.slice(-4));
      userModelArr.push(new UserDetail(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
    }
  }
  return userModelArr;
}
//Horse Page function
async function getHorsePage(req,res){
  // array = array for user
  const userModelArr = await multiHorse(array);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = userModelArr[0].activeRounds[3].date.substring(0,10);
  res.render('pages/horse.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userModelArr, date: date, theme: getTheme(req)});
}

async function ModelComparison(req, res){
  // array = comparison array
  const username = req.params.user;
  const modelArr = await retrieveUserModels(username);
  const userModelArr = await multiHorse(modelArr);
  const date = userModelArr[0].activeRounds[0].date.substring(0,10);
  const round = userModelArr[0].activeRounds[0].roundNumber;
  const percentile = 80;
  let userPercentile = await getPercentile(round, modelArr);
  let newScoreArr = userModelArr.map(model => {
    let modelName = model.modelName;
    let mmc = model.activeRounds[0].mmc;
    let corr = model.activeRounds[0].correlation;
    let newscore = Number(mmc)+Number(corr);
    return new NewScore(modelName, corr, mmc, newscore);
  });
  // console.log(newScoreArr);
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


// async function downloadSQL(req, res){
//   const username = req.params.user;
//   await client.query(`\copy (SELECT round, model, corr, percentileAllModelCorr, passingPercentile, percentileValue, mmc, newscore FROM ModelData WHERE username = '${username}') TO '/tmp/numerai_comparison.csv' csv header`);
//   res.download('/tmp/numerai_comparison.csv');
// }
// round	model	corr	percentileallmodelcorr	passingpercentile	percentilevalue	mmc	newscore
// 242	equinox	0.013594668	80	TRUE	0.029695973	0.012317861	0.025912528
// 242	gerstej9	0.013335187	80	FALSE	0.029695973	0.012128109	0.025463296

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

async function userAddModel(req, res){
  const username = req.params.username;
  const newModel = req.body.model;
  let test = await retrieveObject(userProfile(`${newModel}`));
  console.log(test.v2UserProfile);
  if(test.v2UserProfile === null){
    res.redirect(`/${username}/model_not_found`);
  }else{
    await client.query(`UPDATE userProfile SET models = models || '{${newModel}}' WHERE username = '${username}'`);
    res.redirect(`/detail/${username}`);
  }
}

async function modelNotFound(req, res){
  const username = req.params.user;
  const modelArr = await retrieveUserModels(username);
  const userModelArr = await multiHorse(modelArr);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = userModelArr[0].activeRounds[3].date.substring(0,10);
  modelFound = false;
  res.render('pages/userDetails.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userModelArr, date: date, username: username, modelFound: modelFound, theme: getTheme(req)});
}

async function userRemoveModel(req, res){
  const username = req.params.username;
  const removeModel = req.body.model;
  // console.log(username);
  client.query(`SELECT * FROM userProfile WHERE username = '${username}'`)
    .then(result => console.log(result.rows));
  await client.query(`UPDATE userProfile SET models = array_remove(models, '${removeModel}') WHERE username = '${username}'`);
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
  const ninentyPercentile = percentileValue(filteredMmcArr, 90);
  console.log(round);
  const userNinety = modelMmcArr.filter(user => user.mmc > ninentyPercentile);
  userNinety.sort(sortUsersMmc);
  userNinety.forEach(user => console.log(`${user.username}: ${user.mmc.toFixed(3)}`));
  console.log(userNinety.length);
}


//Executable functions


//TODO uncouple model new score and c reate for each individual
//Change pocketmonkey to monkey


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

client.connect().then(() => {
  app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
});

//Get every model for every round
//Get rid of rest of database
//Make model comparison dynamically rendered

// All Data
// round Number, model name, mmc, cor, stake, nmr PriceUSD

