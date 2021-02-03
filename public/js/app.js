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

function hideUserStatus(){
  if (userStatus !== 'no'){
    $('#user-not').hide();
  }
  if(newUserStatus !== 'yes'){
    $('#user-does').hide();
  }
}

function deleteModelOrCollectionCollection(event){
  event.preventDefault();
  const collectionName = $('.selected-collection').text().trim();

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

function addModel(){
  const modelToAdd = $('#model-to-add').val().trim().toLowerCase();

  if (!modelToAdd) {
    return;
  }

  $('#modelList').append($(modelButton(modelToAdd)));
  $('#detailButton').before(`<input type = "hidden" name = "model" value = "${modelToAdd}"></input>`);
  $('.removeModels').on('click', deleteModelOrCollection);
  $('#model-to-add').val('');
  changeFormAction();
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
  $('.removeCollection').on('click', deleteModelOrCollection);
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

function modelNotFound(){
  const modelFoundUser = $('#modelExistsUser').val();
  const modelFound = $('#modelFound').val();
  if(modelFound !== 'false'){
    const LSmodels = localStorage.getItem('collections');
    const modelCollections = JSON.parse(LSmodels);
    $('#collectionName').val(`${modelFoundUser}`);
    const targetCollection = modelCollections.filter(collection => collection.collectionName === modelFoundUser);
    const models = targetCollection[0].modelCollection;
    models.forEach(model => {
      if(model === modelFound){
        $('#modelList').append($(`<li class = "modelArray"><h2>${model}</h2><h3>(Model Not Found)</h3><img class = "removeModels" src = "https://p.kindpng.com/picc/s/19-191468_png-file-svg-minus-sign-icon-transparent-png.png"></li>`));
      }else{
        $('#modelList').append($(`<li class = "modelArray"><h2>${model}</h2><img class = "removeModels" src = "https://p.kindpng.com/picc/s/19-191468_png-file-svg-minus-sign-icon-transparent-png.png"></li>`));
      }
      $('.removeModels').on('click', deleteModelOrCollection);
      $('#addModel').prop('checked', false);
      $('#model-to-add').val('');
      $('#detailButton').before(`<input type = "hidden" name = "model" value = "${model}"></input>`);
    });
    changeFormAction();
  }
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
  let modelArray = models;
  // console.log(models);
  // if(typeof(modelArray) === 'string'){
  //   modelArray = [modelArray];
  // }
  // const username = req.params.user;
  // modelFound = true;
  const userModelArr = await multiHorse(modelArray);
  console.log(userModelArr);
  // if(userModelArr[0] === false){
  //   res.render('pages/home.ejs', {userExist: 'none', theme: getTheme(req), modelExistsUser: username, modelName: userModelArr[1], topTen: false});
  // }else{
  //   const currentNmr = await retrieveObject(latestNmrPrice());
  //   const nmrPrice = Number(currentNmr.latestNmrPrice.PriceUSD);
  //   const date = userModelArr[0].activeRounds[3].date.substring(0,10);
  //   res.render('pages/userDetails.ejs', {nmrPrice: nmrPrice.toFixed(2), userData: userModelArr, date: date, username: username, modelFound: modelFound, theme: getTheme(req)});
  // }
}

async function multiHorse(arr){
  let userModelArr = [];
  for(let i = 0; i < arr.length; i++){
    try{
      console.log(arr[i].toLowerCase());
      const user = await retrieveObject(userProfile(arr[i]));
      console.log(user);
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
      userModelArr.push(new Object(userMmcRankCurrent, userMmcRankPrev, userCorrCurrent, userCorrPrev, activeRounds, totalStake, modelName, dailyChange));
    }
    catch(error){
      console.log(error);
      userModelArr = [false, arr[i]];
    }
  }
  return userModelArr;
}

async function init(){
  const NMRprice = await retrieveObject(latestNmrPrice());
  console.log(NMRprice);
  // console.log(await retrieveObject(latestNmrPrice()));
  // modelNotFound();
  topTenCollection();
  $('#save-new-model').on('click', addModel);
  $('#save-collection-button').on('click', saveModelCollection);
  $('#clear-model-list-button').on('click', clearModels);
  hideUserStatus();
  renderModelCollectionNames('Top Ten');
  $('#addModel').hide();

  $('#add-collection-button').on('click', newCollection);
  $('#collection-name').keypress(function (e) {
    if (e.which === 13) {
      $('#add-collection-button').trigger('click');
    }
  });
}

init();

