var restify = require('restify');
var restifySwagger = require('node-restify-swagger');
var restifyValidation = require('node-restify-validation');


var server = restify.createServer({
    name: 'loma-api',
    version: '0.0.1'
});

server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.gzipResponse());
server.use(restify.queryParser());
server.use(restifyValidation.validationPlugin({errorsAsArray: false}));

server.get(/\/data\/?.*/, restify.serveStatic({
    directory: './data'
}));

server.get(/\/static\/?.*/, restify.serveStatic({
    directory: './static'
}));

// For preflight request w/ CORS.
server.opts(/\.*/, function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Token');
    res.send(200);
    next();
});

restifySwagger.configure(server);
restifySwagger.loadRestifyRoutes();

module.exports = server;
