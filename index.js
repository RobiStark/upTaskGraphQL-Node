const {ApolloServer} = require('apollo-server');
const jwt = require('jsonwebtoken');
require('dotenv').config('variables.env');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const conectarDB = require('./config/db');
const { Token } = require('graphql');

//Conectar a la DB
conectarDB();


const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: ({req}) => {
        const token = req.headers['authorization'] || '';
        if(token){
            try {;
                const usuario = jwt.verify(token,process.env.SECRET);
                
                return(usuario);
            } catch (error) {
                
            }
        }
    } 
});

server.listen().then(({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
})