const express = require('express');
require('dotenv').config();
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;
const percentile = require('stats-percentile');

const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');


//Global Constant
const latestRoundsPosition = 4;
const gBoys = [
  'rgb_arp',
  'rgb_moog',
  'burning_flash',
  'as_i_was',
  'all_were_connected',
  'by_this_illusive',
  'all_that_eye',
  '____cycles____',
  'robot_sam',
  'mistborn',
  'jules_verne',
  'dies',
  'sauce_files',
  'pizzadragon',
  'parfection',
  'mediocrity',
  'cash_me_outside',
  'cat_and_dog',
  'gerstej9',
  'lottery_of_babylon',
  'vincent_moon',
  'kafka_murakami',
  'fuka_eri',
  'miss_may',
  'bamboo_cat',
  'baby_dragon',
  'kira_bella',
  'wallingford_nut',
  'kokedama',
  'cyanesce',
  'wild_sheep',
  'equinox',
  'three_kingdoms'
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
app.get('/percent', getPercentile);
app.get('/horseracemobile', getHorsePage);

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
  const gboyModelArr = filteredArr.filter(user => modelArr.includes(user.username));
  console.log(roundNumber);
  const gBoyNinety = gboyModelArr.filter(user => user.correlation > ninentyPercentile);
  gBoyNinety.sort(sortUsersCorr);
  gBoyNinety.forEach(user => console.log(`${user.username}: ${user.correlation.toFixed(3)}`));
  console.log(gBoyNinety.length);
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
async function getHomepage(req,res){
  const [currentNmr, userData] = await Promise.all([
    // retrieveObject(roundResolve(190)),
    retrieveObject(latestNmrPrice()),
    horse_race('gerstej9')
  ]);
  // const roundCloseDate = roundClose.rounds[0].resolveTime;
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  // console.log(userData);
  res.render('index.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userData, latestRounds: userData[latestRoundsPosition]});
}

async function multiHorse(){
  let gBoyModelArr = [];
  for(let i = 0; i < gBoys.length; i++){
    const user = await retrieveObject(userProfile(gBoys[i]));
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
    gBoyModelArr.push(new UserDetail(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
  }
  return gBoyModelArr;
}
//Horse Race Page function
async function getHorsePage(req,res){
  const gBoyModelArr = await multiHorse();
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  const date = gBoyModelArr[0].activeRounds[3].date.substring(0,10);
  // console.log(gBoyModelArr[0].activeRounds.length);
  // console.log(gBoyModelArr[5]);
  // console.log(gBoyModelArr.slice(0,15));
  // console.log(gBoyModelArr.slice(15,25));
  // console.log(gBoyModelArr.slice(25,40));
  // console.log(gBoyModelArr);
  // console.log(currentNmr);
  // console.log(latestRounds);
  res.render('pages/horse.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: gBoyModelArr, date: date});
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
  const gBoyNinety = modelMmcArr.filter(user => user.mmc > ninentyPercentile);
  gBoyNinety.sort(sortUsersMmc);
  gBoyNinety.forEach(user => console.log(`${user.username}: ${user.mmc.toFixed(3)}`));
  console.log(gBoyNinety.length);
}


//Executable functions
// userProfileMmc('gerstej9', 239);
// getHorsePage(gBoys);
// calculateRoundInfo(238, gBoys);
// calculateRoundInfo(239, gBoys);
// calculateRoundInfo(240, gBoys);
// calculateRoundInfo(241, gBoys);
// getUsers();
// getPercentile(238, gBoys);
// getPercentile(239, gBoys);
// getPercentile(240, gBoys);
// getPercentile(241, gBoys);
// horse_race("gerstej9");
// retrieveObject(latestNmrPrice())
//   .then(result => console.log(result));


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
