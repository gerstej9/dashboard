'use strict';

const collection = [];
const userStatus = $('.userNot').attr('id');
const newUserStatus = $('.userDoes').attr('id');

const latestNmrPrice = () => `query{latestNmrPrice {
  lastUpdated
  priceUsd
}}`;

const userProfile = username => `query{v2UserProfile(username: "${username}") {
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

const v2Leaderboard = () => `query{v2Leaderboard{
  username
}
}`;

const v2RoundDetails = roundNumber => `query{
  v2RoundDetails(roundNumber:${roundNumber}) {
    roundNumber
    userPerformances {
      correlation
      date
      username
    }
  }
}`;

const modelButton = (model) => `
  <li class = "modelArray listButton">
    <span>${model}</span>
    <i class="fa fa-times-circle removeModels"></i>
  </li>`;

const detailHeader = (date, userData, nmrPrice) => `
  <h3>Date: ${date}</h3>
  <h3>Live Rounds: ${userData.activeRounds[0].roundNumber} to ${userData.activeRounds[3].roundNumber}</h3>
  <h3>NMR Price: $${nmrPrice}</h3>`;

const detailRow = (userData, activeTotal) => `
  <div class = "model-row-div" id = "${userData.modelName}">
    <div class = "modelRow monkey">
      <p class = "collectionModelNames"><img id = "glyph" src="/assets/glyph_2.PNG">${userData.modelName}</p>
      <p class = "total-stake">${userData.totalStake}</p>
      <p class = "active-total">${activeTotal.toFixed(2)}</p>
      <p class = "daily-change">${userData.dailyChange}</p>
      <p class = "prev-rank">${userData.corrPrev}</p>
      <p class = "current-rank">${userData.corrCurrent}</p>
      <p class = "mmc-rank">${userData.mmcCurrent}</p>
    </div>
  </div>
  `;

const modalTitleRow= (userData, avgCorr, avgMmc) => `
  <div class="modal myModal ${userData.modelName}">
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2 id = "modal-model">${userData.modelName}</h2>
      <div class = "modalTitleRow">
        <p>Round</p>
        <p>Corr</p>
        <p>MMC</p>
        <p>NMR Stake</p>
        <p>NMR Payout</p>
      </div>
      <div class = "modalDetailRow">
        <p>Avg</p>
        <p>${avgCorr.toFixed(3)}</p>
        <p>${avgMmc.toFixed(3)}</p>
        <p>-</p>
        <p>-</p>
      </div>
    </div>
  </div>`;

const modalDetailRow = (activeRounds, stake, payout) => `
<div class = "modalTitleRow">
<p>${activeRounds.roundNumber}</p>
<p>${activeRounds.correlation.toFixed(3)}</p>
<p>${activeRounds.mmc.toFixed(3)}</p>
<p>${stake.toFixed(2)}</p>
<p>${payout.toFixed(2)}</p>
</div>`;

const modalModelNotFound = () => `
<div class="modal myModal model-not-found">
  <div id = "not-found" class="modal-content">
    <span class="close">&times;</span>
    <h2>Model Not Found</h2>
  </div>
</div>`;

const detailTotalRow = (dailyChangedAllModels, dailyChangeAllModelsUsd, activeTotalAllModels, currPayoutUsd, userTotalStake,stakedPayoutUsd, userLiveTotal, userLiveTotalUsd) =>`
<div class = "totalRow monkey">
<p>Daily Change NMR: ${parseFloat(dailyChangedAllModels).toLocaleString('en-US')} NMR</p>
<p>Daily Change USD: $${parseFloat(dailyChangeAllModelsUsd).toLocaleString('en-US')}</p>
<p>Total Pending Payout: ${parseFloat(activeTotalAllModels).toLocaleString('en-US')} NMR </p>
<p>Total Pending USD: $${parseFloat(currPayoutUsd).toLocaleString('en-US')}</p>
<p>Total NMR Staked: ${parseFloat(userTotalStake).toLocaleString('en-US')} NMR</p>
<p>Total USD Staked: $${parseFloat(stakedPayoutUsd).toLocaleString('en-US')}</p>
<p>Live Total NMR: ${parseFloat(userLiveTotal).toLocaleString('en-US')} NMR</p>
<p> Live Total USD: $${parseFloat(userLiveTotalUsd).toLocaleString('en-US')}</p>
</div>
`;

const detailTotalStatsRow = (userData, roundZeroAllModelAvgCorr,roundZeroAllModelAvgMmc, roundOneAllModelAvgCorr, roundOneAllModelAvgMmc, roundTwoAllModelAvgCorr, roundTwoAllModelAvgMmc, roundThreeAllModelAvgCorr, roundThreeAllModelAvgMmc, allLiveAllModelAvgCorr, allLiveAllModelAvgMmc) => `
  <div class = "totalRowStats monkey">
    <p id = stat-round>Round</p>
    <p>Collection Avg Corr</p>
    <p>Collection Avg MMC</p>
    <p id = "stat-round">${userData.activeRounds[0].roundNumber} </p>
    <p>${roundZeroAllModelAvgCorr}</p>
    <p>${roundZeroAllModelAvgMmc}</p>
    <p id ="stat-round">${userData.activeRounds[1].roundNumber} </p>
    <p>${roundOneAllModelAvgCorr}</p>
    <p>${roundOneAllModelAvgMmc}</p>
    <p id ="stat-round">${userData.activeRounds[2].roundNumber} </p>
    <p>${roundTwoAllModelAvgCorr}</p>
    <p>${roundTwoAllModelAvgMmc}</p>
    <p id ="stat-round">${userData.activeRounds[3].roundNumber}</p>
    <p>${roundThreeAllModelAvgCorr}</p>
    <p>${roundThreeAllModelAvgMmc}</p>
    <p id ="stat-round">All Live</p>
    <p>${allLiveAllModelAvgCorr}</p>
    <p>${allLiveAllModelAvgMmc}</p>
  </div>
`;

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

function hideUserStatus(){
  if (userStatus !== 'no'){
    $('#user-not').hide();
  }
  if(newUserStatus !== 'yes'){
    $('#user-does').hide();
  }
}

function deleteCollection(){
  const collectionName = $(this).parent().text().trim();
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  let targetIndex = modelCollections.findIndex(i => i.collectionName === collectionName);
  if(targetIndex >=0){
    modelCollections.splice(targetIndex, 1);
    localStorage.setItem('collections', JSON.stringify(modelCollections));
    $('.existing-collections').html('');
    $('#collectionName').val('');
    $('#modelList').html('');
    renderModelCollectionNames();
    $('#detailPage').find('input').remove();
  }
}

function saveModelCollection(){
  const collectionName = $('.selected-collection').text().trim();

  if (collectionName === 'Top Ten') {
    return;
  }

  if(collectionName){
    const models = [];
    $( '.modelArray' ).find('span').each(function() {
      models.push($(this).text().toLowerCase());
    });

    let LSmodels = localStorage.getItem('collections');
    let modelCollections = JSON.parse(LSmodels);
    if(modelCollections === null){
      modelCollections = [];
    }
    let targetIndex = modelCollections.findIndex(i => i.collectionName === collectionName);
    if(targetIndex >=0){
      modelCollections[targetIndex].modelCollection = models;
    }else{
      modelCollections.push({collectionName: collectionName, modelCollection:models});
    }
    localStorage.setItem('collections', JSON.stringify(modelCollections));
    getModelDetails(models);
  }
}

function saveCollectionName(name){
  if (name) {
    let LSmodels = localStorage.getItem('collections');
    let modelCollections = JSON.parse(LSmodels);

    if(modelCollections === null){
      modelCollections = [];
    }

    let targetIndex = modelCollections.findIndex(i => i.name === name);

    if(targetIndex >=0){
      return;
    } else {
      modelCollections.push({ collectionName: name, modelCollection: [] });
    }
    localStorage.setItem('collections', JSON.stringify(modelCollections));
  }
}

async function addModel(){
  $('#model-plus').hide();
  $('.loader').show();
  const modelToAdd = $('#model-to-add').val().trim().toLowerCase();

  if (!modelToAdd) {
    return;
  }

  const modelToRetrieve =  await retrieveObject(userProfile(modelToAdd));
  if(modelToRetrieve.v2UserProfile === null){
    $('#model-plus').show();
    $('.loader').hide();
    $('#model-to-add').val('');
    $('.section-footer').append(modalModelNotFound());
    displayModelNotFoundModal();
    $('.myModal').on('click', () => $('.model-not-found').remove());
    return;
  }else{
    $('#modelList').append($(modelButton(modelToAdd)));
    $('#detailButton').before(`<input type = "hidden" name = "model" value = "${modelToAdd}"></input>`);
    $('.removeModels').on('click', deleteModelOrCollection);
    $('#model-to-add').val('');
    changeFormAction();
    $('#model-plus').show();
    $('.loader').hide();
  }
}

function renderModelCollectionNames(selectedCollection){
  $('.existing-collections').html('');

  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  if(modelCollections !== null){
    modelCollections.forEach(collection => {
      const selected = selectedCollection === collection.collectionName;
      $('.existing-collections').append(`
        <li class="listButton ${selected ? 'selected' : ''}">
          <span class = "collections ${selected ? 'selected-collection' : ''}">${collection.collectionName}</span>
          ${collection.collectionName === 'Top Ten' ? '' : '<i class="fa fa-times-circle removeCollection"></i>'}
        </li>
      `);
    });
  }
  $('.removeCollection').on('click', deleteCollection);
  $('.collections').on('click', renderExistingCollectionModels);
}

function renderExistingCollectionModels(){
  $('#detailPage').find('input').remove();
  $('#modelList').html('');
  const collectionToRetrieve = $(this).text();
  const LSmodels = localStorage.getItem('collections');
  const modelCollections = JSON.parse(LSmodels);
  $('#collectionName').val(`${collectionToRetrieve}`);

  $('.selected').removeClass('selected');
  $('.selected-collection').removeClass('selected-collection');


  $(this).parent().addClass('selected');
  $(this).addClass('selected-collection');

  const targetCollection = modelCollections.filter(collection => collection.collectionName === collectionToRetrieve.trim());
  if (targetCollection[0]) {
    const models = targetCollection[0].modelCollection;
    models.forEach(model => {
      $('#modelList').append($(modelButton(model)));
      $('.removeModels').on('click', deleteModelOrCollection);
      $('#addModel').prop('checked', false);
      $('#model-to-add').val('');
      // $('#detailButton').before(`<input type = "hidden" name = "model" value = "${model}"></input>`);
    });
    getModelDetails(targetCollection[0].modelCollection);
  }
  // changeFormAction();
}

function renderModelCollectionList(models){
  // $('#detailPage').find('input').remove();
  $('#modelList').html('');
  // const collectionToRetrieve = $(this).text();
  // const LSmodels = localStorage.getItem('collections');
  // const modelCollections = JSON.parse(LSmodels);
  // $('#collectionName').val(`${collectionToRetrieve}`);
  // const targetCollection = modelCollections.filter(collection => collection.collectionName === collectionToRetrieve);
  // const models = targetCollection[0].modelCollection;
  models.forEach(model => {
    $('#modelList').append($(modelButton(model)));
    $('.removeModels').on('click', deleteModelOrCollection);
    $('#addModel').prop('checked', false);
    $('#model-to-add').val('');
    // $('#detailButton').before(`<input type = "hidden" name = "model" value = "${model}"></input>`);
  });
  // changeFormAction();
}

function changeFormAction(){
  $('#detailPage').attr('action', '/detail/'+ $('#collectionName').val());
}

function deleteModelOrCollection(){
  const parentHtml = $(this).parent();
  const modelToRemove = parentHtml.find('span').text().trim();
  $(this).parent().remove();
  $( `input[value|='${modelToRemove}']` ).remove();

  // TODO: Update localstorage for model and collection
}

function newCollection(){
  const text = 'Create Collection';

  const collectionInput = $('#collection-name');

  if ($(this).text() === text) {
    const newCollectionName = collectionInput.val().trim();

    collectionInput.removeClass('open');
    $(this).html('<i class="fa fa-plus"></i>New Collection');

    if (!newCollectionName) {
      return;
    }

    saveCollectionName(newCollectionName);


    renderModelCollectionNames(newCollectionName);

    renderModelCollectionList([]);

    return;
  }

  collectionInput.addClass('open');
  $(this).text(text);
}


function clearModels() {
  renderModelCollectionList([]);
}

// TODO: Render selected collection button differently from others

function topTenCollection(){
  let topTenArr = [];
  $('.topTen').each(function() {
    topTenArr.push($(this).val());
  });
  if(topTenArr[0]){
    let LSmodels = localStorage.getItem('collections');
    let modelCollections = JSON.parse(LSmodels);
    if(modelCollections === null){
      modelCollections = [];
    }
    let targetIndex = modelCollections.findIndex(i => i.collectionName === 'Top Ten');
    if(targetIndex >=0){
      modelCollections[targetIndex].modelCollection = topTenArr;
    }else{
      modelCollections.push({collectionName: 'Top Ten', modelCollection:topTenArr});
    }
    localStorage.setItem('collections', JSON.stringify(modelCollections));
    renderModelCollectionList(topTenArr);
    getModelDetails(topTenArr);
  }
}

async function retrieveObject(queryInput){
  return new Promise (function(resolve, reject){
    $.ajax({url: 'https://api-tournament.numer.ai/',
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ query:  queryInput
      }),
      success: function (data){
        resolve(data.data);
      },
      error: function(error){
        reject(error);
      }
    });
  });
}


//Model Detail Page
async function getModelDetails(models){
  $('#hide-on-load').hide();
  $('.loader-detail').show();
  $('.totalRow').hide();
  $('.totalRowStats').hide();
  $('#detail-header').hide();
  const userModelArr = await multiHorse(models);
  const currentNmr = await retrieveObject(latestNmrPrice());
  const nmrPrice = Number(currentNmr.latestNmrPrice.priceUsd).toFixed(2);
  const date = userModelArr[0].activeRounds[3].date.substring(0,10);
  renderModelDetails(nmrPrice, userModelArr, date);
  $('.loader-detail').hide();
  $('#hide-on-load').show();
  $('#detail-header').show();
}


async function multiHorse(arr){
  let userModelArr = [];
  for(let i = 0; i < arr.length; i++){
    try{
      // console.log(arr[i].toLowerCase());
      const user = await retrieveObject(userProfile(arr[i]));
      // console.log(user);
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
      console.log(error);
      userModelArr = [false, arr[i]];
    }
  }
  return userModelArr;
}

function displayModal(){
  const modalTargetModel = $(this).find('.collectionModelNames').html();
  const modalTargetModelStripped = modalTargetModel.substring(42);
  $(`.${modalTargetModelStripped}`).css('display', 'block');
}

function displayModelNotFoundModal(){
  $('.model-not-found').show();
}

function closeModal(){
  $('.myModal').css('display', 'none');
}

function renderModelDetails(nmrPrice, userData, date){
  $('.modal').remove();
  $('.model-row-div').remove();
  $('.totalRow').remove();
  $('.totalRowStats').remove();
  $('#detail-header').html('');
  $('#detail-header').append(detailHeader(date, userData[0], nmrPrice));
  $('#user').text(`Collection: ${$('.selected-collection').text()}`);
  let userTotalStake = 0;
  let activeTotalAllModels = 0;
  let dailyChangedAllModels = 0;
  let roundZeroAllModelSumCorr= 0;
  let roundZeroAllModelSumMmc = 0;
  let roundOneAllModelSumCorr= 0;
  let roundOneAllModelSumMmc = 0;
  let roundTwoAllModelSumCorr= 0;
  let roundTwoAllModelSumMmc = 0;
  let roundThreeAllModelSumCorr= 0;
  let roundThreeAllModelSumMmc = 0;
  let allLiveAllModelSumCorr = 0;
  let allLiveAllModelSumMmc = 0;
  for(let i = 0; i<userData.length; i++){
    roundZeroAllModelSumCorr += userData[i].activeRounds[0].correlation;
    roundZeroAllModelSumMmc += userData[i].activeRounds[0].mmc;
    roundOneAllModelSumCorr+= userData[i].activeRounds[1].correlation;
    roundOneAllModelSumMmc += userData[i].activeRounds[1].mmc;
    roundTwoAllModelSumCorr+= userData[i].activeRounds[2].correlation;
    roundTwoAllModelSumMmc += userData[i].activeRounds[2].mmc;
    roundThreeAllModelSumCorr+= userData[i].activeRounds[3].correlation;
    roundThreeAllModelSumMmc += userData[i].activeRounds[3].mmc;
    userTotalStake += Number(userData[i].totalStake);
    let activeTotal = 0;
    for(let j =0; j< userData[i].activeRounds.length; j++){
      activeTotal+= Number(userData[i].activeRounds[j].payoutPending);
    }
    if(isNaN(activeTotal) === true){activeTotal = 0;}
    dailyChangedAllModels += Number(userData[i].dailyChange);
    $('.model-detail-row-section').append(detailRow(userData[i], activeTotal));
    let corrSum = 0;
    for(let j = 0; j<4; j++){corrSum += userData[i].activeRounds[j].correlation;}
    let avgCorr = (corrSum/4);
    allLiveAllModelSumCorr += avgCorr;
    let mmcSum = 0;
    for(let j =0; j< 4; j++){ mmcSum+= userData[i].activeRounds[j].mmc;}
    let avgMmc = (mmcSum/4);
    allLiveAllModelSumMmc += avgMmc;
    $(`#${userData[i].modelName}`).append(modalTitleRow(userData[i], avgCorr, avgMmc));
    for(let j =0; j<4; j++){
      let stake = Number(userData[i].activeRounds[j].selectedStakeValue);
      let payout = Number(userData[i].activeRounds[j].payoutPending);
      let activeRounds = userData[i].activeRounds[j];
      // $('.modalDetailRow').after(modalDetailRow(activeRounds, stake, payout));
      $(`.${userData[i].modelName}`).find('.modalDetailRow').after(modalDetailRow(activeRounds, stake, payout));
    }
    activeTotalAllModels += Number(activeTotal);
  }
  let dailyChangeAllModelsUsd = Number(dailyChangedAllModels * nmrPrice).toFixed(2);
  let currPayoutUsd = Number(activeTotalAllModels * nmrPrice).toFixed(2);
  let stakedPayoutUsd = Number(userTotalStake * nmrPrice).toFixed(2);
  let userLiveTotal = (userTotalStake + activeTotalAllModels).toFixed(2);
  let userLiveTotalUsd = (userLiveTotal * nmrPrice).toFixed(2);
  $('#user-detail').append(detailTotalRow(dailyChangedAllModels.toFixed(2), dailyChangeAllModelsUsd, activeTotalAllModels.toFixed(2), currPayoutUsd, userTotalStake.toFixed(2),stakedPayoutUsd, userLiveTotal, userLiveTotalUsd));
  let roundZeroAllModelAvgCorr= (roundZeroAllModelSumCorr/ userData.length).toFixed(3);
  let roundZeroAllModelAvgMmc = (roundZeroAllModelSumMmc/ userData.length).toFixed(3);
  let roundOneAllModelAvgCorr= (roundOneAllModelSumCorr/ userData.length).toFixed(3);
  let roundOneAllModelAvgMmc = (roundOneAllModelSumMmc/ userData.length).toFixed(3);
  let roundTwoAllModelAvgCorr= (roundTwoAllModelSumCorr/ userData.length).toFixed(3);
  let roundTwoAllModelAvgMmc = (roundTwoAllModelSumMmc/ userData.length).toFixed(3);
  let roundThreeAllModelAvgCorr= (roundThreeAllModelSumCorr/ userData.length).toFixed(3);
  let roundThreeAllModelAvgMmc = (roundThreeAllModelSumMmc/ userData.length).toFixed(3);
  let allLiveAllModelAvgCorr = (allLiveAllModelSumCorr/ userData.length).toFixed(3);
  let allLiveAllModelAvgMmc = (allLiveAllModelSumMmc/ userData.length).toFixed(3);
  $('#user-detail').append(detailTotalStatsRow(userData[0], roundZeroAllModelAvgCorr,roundZeroAllModelAvgMmc, roundOneAllModelAvgCorr, roundOneAllModelAvgMmc, roundTwoAllModelAvgCorr, roundTwoAllModelAvgMmc, roundThreeAllModelAvgCorr, roundThreeAllModelAvgMmc, allLiveAllModelAvgCorr, allLiveAllModelAvgMmc));
  $('.myModal').on('click', closeModal);
  $('.modelRow').on('click', displayModal);
  sortDetailRows();
}

function columnSort(field, direction){
  if(field === '.collectionModelNames'){
    return function (a, b) {
      let aText = $(a).find(field).html().substring(42);
      let bText = $(b).find(field).html().substring(42);
      if ( aText < bText ) {
        return direction[1];
      }
      if ( aText > bText ) {
        return direction[2];
      }
      return 0;
    };
  }
  else{
    return function (a, b) {
      let aText = $(a).find(field).html();
      let bText = $(b).find(field).html();
      if(direction[0] === 'up')
        return aText - bText;
      else if(direction[0] === 'down'){
        return bText-aText;
      }
    };
  }
}

function checkSortingIndicator(sortingIndicator){
  if(!sortingIndicator || sortingIndicator.includes('down') || sortingIndicator === 'fa'){
    return ['up', -1, 1];
  }else if(sortingIndicator.includes('up')){
    return ['down', 1, -1];
  }
}

function sortDetailRows(){
  const sortingProperty = $(this).attr('id');
  const sortingDirectionIndicator = $(this).find('i').attr('class');
  const sortingDirection = checkSortingIndicator(sortingDirectionIndicator);
  if(!sortingDirectionIndicator || sortingDirectionIndicator.includes('down')|| sortingDirectionIndicator === 'fa'){
    $('i').removeClass('fa-sort-down');
    $('i').removeClass('fa-sort-up');
  }else if(sortingDirectionIndicator.includes('up')){
    $('i').removeClass('fa-sort-up');
  };
  const detailRow = $('.model-detail-row-section');
  const detailRowList = detailRow.children('div');
  if(sortingProperty === 'model-name-title'){
    $('#model-name-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.collectionModelNames', sortingDirection));
  }
  if(sortingProperty === 'total-staked-title'){
    $('#total-staked-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.total-stake', sortingDirection));
  }
  if(sortingProperty === 'payout-title'){
    $('#payout-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.active-total', sortingDirection));
  }
  if(sortingProperty === 'daily-change-title'){
    $('#daily-change-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.daily-change', sortingDirection));
  }
  if(sortingProperty === 'prev-rank-title'){
    $('#prev-rank-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.prev-rank', sortingDirection));
  }
  if(sortingProperty === 'rank-title' || !sortingProperty){
    $('#rank-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.current-rank', sortingDirection));
  }
  if(sortingProperty === 'mmc-rank-title'){
    $('#mmc-rank-title').find('i').addClass(`fa-sort-${sortingDirection[0]}`);
    detailRowList.sort(columnSort('.mmc-rank', sortingDirection));
  }
  detailRow.append(detailRowList);
}


async function init(){
  // const NMRprice = await retrieveObject(latestNmrPrice());
  // console.log(NMRprice);
  // console.log(await retrieveObject(latestNmrPrice()));
  // modelNotFound();
  // $('.fa-sort-up').hide();
  // $('.fa-sort-up').hide();
  $('.loader').hide();
  $('.myModal').on('click', closeModal);
  $('.modelRow').on('click', displayModal);
  $('span').on('click', closeModal);
  topTenCollection();
  $('#save-new-model').on('click', addModel);
  $('#save-collection-button').on('click', saveModelCollection);
  $('#clear-model-list-button').on('click', clearModels);
  hideUserStatus();
  renderModelCollectionNames('Top Ten');
  $('#addModel').hide();
  $('#model-name-title').on('click',sortDetailRows);
  $('#total-staked-title').on('click',sortDetailRows);
  $('#payout-title').on('click',sortDetailRows);
  $('#daily-change-title').on('click',sortDetailRows);
  $('#prev-rank-title').on('click',sortDetailRows);
  $('#rank-title').on('click',sortDetailRows);
  $('#mmc-rank-title').on('click',sortDetailRows);
  $('#add-collection-button').on('click', newCollection);
  $('#collection-name').keypress(function (e) {
    if (e.which === 13) {
      $('#add-collection-button').trigger('click');
    }
  });
}

init();
