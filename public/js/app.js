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

function createModelCollection(event){
  event.preventDefault();
  const model = $('#model').val();
  const collectionName = $('#collectionName').val();
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  if(modelCollections === null){
    modelCollections = [];
  }
  modelCollections.push({collectionName: collectionName, modelCollection:model});
  localStorage.setItem('collections', JSON.stringify(modelCollections));
}

function addModel(event){
  event.preventDefault();
  console.log('hello');
  console.log($('#model-to-add').val());
  $('#collectionSubmit').before($('<h2></h2>'));
}

function renderModelCollection(){
  let LSmodels = localStorage.getItem('collections');
  let modelCollections = JSON.parse(LSmodels);
  // $('.existing-collections').append(template);
  if(modelCollections !== null){
    modelCollections.forEach(collection => {
      // let template = $('#collectionTemplate').html();
      // let collectionTag = template.find('h2');
      // // collectionTag.find('h2').text(collection.collectionName);
      // $('.existing-collections').append(collectionTag);
      $('.existing-collections').append(`<h2>${collection.collectionName}</h2>`);
    });
  }
}

$('#addModel').change(addModel);
$('#newCollection').on('submit',createModelCollection);
hideUserStatus();
$('#collectionTemplate').hide();
renderModelCollection();



//TODO prevent repeat names in local storage for collection names
