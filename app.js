var settings = require('./settings');

var db = require('./db');
var server = require('./server');


[
    'app/detail',
    'app/list',
    'app/search',
    'app/submit',
    'user/login'
].forEach(function(view) {
    require('./views/' + view)(server);
});

server.listen(process.env.PORT || settings.PORT || 5000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
