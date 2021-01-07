const express = require('express');
require('dotenv').config();
const fetch = require('node-fetch');
const PORT = process.env.PORT || 9999;
const percentile = require('stats-percentile');

const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.get('/', getHomepage);
app.get('/percent', getPercentile);

const ***REMOVED*** = [
  '***REMOVED***',
  '***REMOVED***',
  '***REMOVED***',
  'onesimplenight',
  'dg',
  'era__mix__2000',
  'era__mix__2001',
  'rgb_alpha',
  'bookofillusions',
  'thread__of__change',
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

const sortUsers = (leftModel, rightModel) =>{
  if(leftModel.correlation < rightModel.correlation){
    return -1;
  }else if(leftModel.correlation > rightModel.correlation){
    return 1;
  }else{
    return 0;
  }
};



function p90(arr){
  const ninety = percentile(arr, 90);
  return ninety;
}

async function getHomepage(req,res){
  const [currentNmr, userData] = await Promise.all([
    // retrieveObject(roundResolve(190)),
    retrieveObject(latestNmrPrice()),
    horse_race('***REMOVED***')
  ]);
  // const roundCloseDate = roundClose.rounds[0].resolveTime;
  const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  // console.log(userData);
  res.render('index.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userData, latestRounds: userData[4]});
}


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

async function getPercentile(roundNumber, modelArr){
  const roundBoard = await retrieveObject(v2RoundDetails(roundNumber));
  const userPerformanceArr = roundBoard.v2RoundDetails.userPerformances;
  // console.log(userPerformanceArr[1]);
  const endDate = userPerformanceArr[0].date;
  const filteredArr = userPerformanceArr.filter(user => user.date === endDate);
  const corrArr = filteredArr.map(user => user.correlation);
  const ninentyPercentile = p90(corrArr);
  const ***REMOVED***ModelArr = filteredArr.filter(user => modelArr.includes(user.username));
  console.log(roundNumber);
  const ***REMOVED***Ninety = ***REMOVED***ModelArr.filter(user => user.correlation > ninentyPercentile);
  ***REMOVED***Ninety.sort(sortUsers);
  ***REMOVED***Ninety.forEach(user => console.log(`${user.username}: ${user.correlation.toFixed(3)}`));
  console.log(***REMOVED***Ninety.length);
}

async function getUsers(){
  const leaderboard = await retrieveObject(v2Leaderboard());
  const leaderboardUsers = leaderboard.v2Leaderboard;
  let users = leaderboardUsers.map(user => user.username);
  return users;
}


// getUsers();
// getPercentile(238, ***REMOVED***);
// getPercentile(239, ***REMOVED***);
// getPercentile(240, ***REMOVED***);
// getPercentile(241, ***REMOVED***);
// horse_race("***REMOVED***");
// retrieveObject(latestNmrPrice())
//   .then(result => console.log(result));


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
