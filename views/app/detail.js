var applib = require('../../lib/app');
var db = require('../../db');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/app/?slug=open-table'
    server.get({
        url: '/app/',
        swagger: {
            nickname: 'detail',
            notes: 'Specific details and metadata about an app',
            summary: 'App details'
        },
        slug: {
            description: 'Slug',
            isRequired: true
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var slug = GET.slug;

        if (!slug) {
            res.json(400, {error: 'bad_app'});
            done();
            return;
        }

        applib.getAppFromSlug(client, slug, function(err, app) {
            if (!app) {
                res.json(500, {error: 'db_error'});
            } else {
                res.json(app);
            }
            done();
        });
    }));
};
