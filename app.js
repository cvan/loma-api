var settings = require('./settings_local');

var db = require('./db');
var server = require('./server');


[
    'app/detail',
    'app/manifest',
    'app/submit'
].forEach(function(view) {
    require('./views/' + view)(server);
});

server.listen(process.env.PORT || 5000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
