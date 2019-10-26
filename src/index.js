const dotenv = require('dotenv');
dotenv.config();

const express = require('express');

const { ApolloServer } = require('apollo-server-express');
const http = require('http');
const typeDefs = require('./grapql/schema/typeDefs');
const resolvers = require('./grapql/resolvers');

const PORT = process.env.PORT;
const app = express();

const jwt = require('jsonwebtoken')


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authorization = req.headers.authorization
    const token = authorization ? authorization.replace('Bearer ', '') : ''
    let user = null;
    if (token) {
      user = jwt.decode(token)
    }

    return { user, req, token }
  },
});

server.applyMiddleware({
  app
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});