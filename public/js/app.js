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
  renderModelCollection();
}

function addModel(){
  const modelToAdd = $('#model-to-add').val();
  $('#modelList').append($(`<li class = "modelArray"><h2>${modelToAdd}</h2><span>X</span></li>`));
  $('span').on('click', deleteModel);
  $('#addModel').prop('checked', false);
  $('#model-to-add').val('');
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

function deleteModel(){
  console.log('hello');
  $('span').closest('li').remove();
}

$('#addModel').change(addModel);
$('#newCollection').on('submit',createModelCollection);
hideUserStatus();
$('#collectionTemplate').hide();
renderModelCollection();



//TODO prevent repeat names in local storage for collection names
