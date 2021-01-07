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

const gBoys = [
  'rgb_arp',
  'rgb_moog',
  'burning_flash',
  'onesimplenight',
  'dg',
  'era__mix__2000',
  'era__mix__2001',
  'rgb_alpha',
  'bookofillusions',
  'thread__of__change',
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

function p90(arr){
  const ninety = percentile(arr, 90);
  return ninety;
}

async function getHomepage(req,res){
  const [currentNmr, userData] = await Promise.all([
    // retrieveObject(roundResolve(190)),
    retrieveObject(latestNmrPrice()),
    horse_race('gerstej9')
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
  console.log(roundNumber);
  const roundBoard = await retrieveObject(v2RoundDetails(roundNumber));
  const userPerformanceArr = roundBoard.v2RoundDetails.userPerformances;
  // console.log(userPerformanceArr[1]);
  const endDate = userPerformanceArr[0].date;
  const filteredArr = userPerformanceArr.filter(user => user.date === endDate);
  const corrArr = filteredArr.map(user => user.correlation);
  ninentyPercentile = p90(corrArr);
  
  
}

getPercentile(240, "gerstej9");
// horse_race("gerstej9");
// retrieveObject(latestNmrPrice())
//   .then(result => console.log(result));


app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

app.listen(PORT,() => console.log(`Listening on: ${PORT}`));
