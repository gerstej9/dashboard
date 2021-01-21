'use strict';


const userStatus = $('.userNot').attr('id');
const newUserStatus = $('.userDoes').attr('id');


function hideUserStatus(){
  if (userStatus !== 'no'){
    $('#user-not').hide();
  }
  if(newUserStatus !== 'yes'){
    $('#user-does').hide();
  }
}

function deleteModelCollection(event){
  event.preventDefault();
  const collectionName = $('#collectionName').val();
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  let targetIndex = modelCollections.findIndex(i => i.collectionName === collectionName);
  modelCollections.splice(targetIndex, 1);
  console.log(modelCollections);
  localStorage.setItem('collections', JSON.stringify(modelCollections));
  $('.existing-collections').html('');
  $('#collectionName').val('');
  $('#modelList').html('');
  renderModelCollectionNames();
}

function saveModelCollection(event){
  event.preventDefault();
  // const model = $('#model').val();
  const models = [];
  $( ".modelArray" ).find('h2').each(function() {
    models.push($(this).text());
  });
  console.log(models);
  const collectionName = $('#collectionName').val();
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  if(modelCollections === null){
    modelCollections = [];
  }
  modelCollections.push({collectionName: collectionName, modelCollection:models});
  localStorage.setItem('collections', JSON.stringify(modelCollections));
  $('#collectionName').val('');
  $('ul').html('');
  renderModelCollectionNames();
}

function addModel(){
  const modelToAdd = $('#model-to-add').val();
  $('#modelList').append($(`<li class = "modelArray"><h2>${modelToAdd}</h2><span class = "removeModels">X</span></li>`));
  $('.removeModels').on('click', deleteModel);
  $('#addModel').prop('checked', false);
  $('#model-to-add').val('');
}

function renderModelCollectionNames(){
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  // $('.existing-collections').append(template);
  if(modelCollections !== null){
    modelCollections.forEach(collection => {
      // let template = $('#collectionTemplate').html();
      // let collectionTag = template.find('h2');
      // // collectionTag.find('h2').text(collection.collectionName);
      // $('.existing-collections').append(collectionTag);
      $('.existing-collections').append(`<li><h2 class = "collections">${collection.collectionName}</h2></li>`);
    });
  }
  $('.removeCollection').on('click', deleteModel);
  $('.collections').on('click', renderExistingCollectionModels);
}

function renderExistingCollectionModels(){
  $('#modelList').html('');
  const collectionToRetrieve = $(this).text();
  const LSmodels = localStorage.getItem('collections');
  const modelCollections = JSON.parse(LSmodels);
  // console.log(collectionToRetrieve);
  // console.log(modelCollections);
  $('#collectionName').val(`${collectionToRetrieve}`);
  const targetCollection = modelCollections.filter(collection => collection.collectionName === collectionToRetrieve);
  const models = targetCollection[0].modelCollection;
  models.forEach(model => {
    $('#modelList').append($(`<li class = "modelArray"><h2>${model}</h2><span class = "removeModels">X</span></li>`));
    $('.removeModels').on('click', deleteModel);
    $('#addModel').prop('checked', false);
    $('#model-to-add').val('');
  });
}

function deleteModel(){
  $(this).parent().html('');
}


$('#addModel').change(addModel);
// $('#newCollection').on('submit',createModelCollection);
$('#saveCollection').on('click', saveModelCollection);
$('#deleteCollection').on('click', deleteModelCollection);
hideUserStatus();
renderModelCollectionNames();



//TODO prevent repeat names in local storage for collection names


// $( "li" ).find('h2').each(function() {
//   console.log($( this ).text() );
// });