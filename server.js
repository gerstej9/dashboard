// const express = require('express');

// const { graphqlHTTP } = require('express-graphql');
// const { buildSchema} = require('graphql');
// require('dotenv').config();
// const PORT = process.env.PORT || 9999;

// // app.use(express.static('./public'));
// // app.use(express.urlencoded({extended:true}));
// // app.set('view engine', 'ejs');

// // app.get('/', getHomepage);

// const schema = buildSchema(`
//   type Query {
//     hello: String
//   }
// `);

// const root = {
//   hello: () =>{
//     return 'Hello world';
//   },
// };

// // function getHomepage(req,res){
// //   res.render('index.ejs');
// // }

// const app = express();
// app.use('/graphql', graphqlHTTP({
//   schema: schema,
//   rootValue: root,
//   graphiql: true,
// }));

// app.use('*', (req, res) => res.status(404).send('Route you are looking for is not available'));

// app.listen(PORT,() => console.log(`Listening on: ${PORT}`));

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fetch = require('node-fetch');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => {
    return 'Hello world!';
  },
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

function retrieveObject(){
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({query: "{ hello }"})
  })
    .then(r => r.json())
    .then(data => console.log('data returned:', data));
}

retrieveObject();

app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
