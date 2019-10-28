const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const express = require('express');
const cors = require('cors')
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken')

const typeDefs = require('./grapql/schema/typeDefs');
const resolvers = require('./grapql/resolvers');
const upload = require('./uploader');

const PORT = process.env.PORT;
const app = express();


app.use('/uploads', express.static('uploads'));
app.use(cors({ origin: '*' }))


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, connection }) => {
    if (connection) {
      // check connection for metadata
      return connection.context;
    }
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


app.post('/file', upload.single('file'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }

  res.send({ filename: file.filename })
})

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});