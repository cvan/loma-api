var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/app/submit' -d 'name=Open Table&app_url=http://m.opentable.com'
    server.post({
        url: '/app/submit',
        swagger: {
            nickname: 'submit',
            notes: 'Submit app',
            summary: 'Submission'
        },
        validation: {
            app_url: {
                description: 'App URL',
                isRequired: true,
                isUrl: true
            },
            homepage_url: {
                description: 'Homepage URL',
                isRequired: false,
                isUrl: true
            },
            icons: {
                description: 'Icons',
                isRequired: false,
            },
            name: {
                description: 'Name',
                isRequired: true,
                max: 128
            },
            screenshots: {
                description: 'Screenshots',
                isRequired: false
            },
            category: {
                description: 'Category',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var token = req.headers.token;
        var email = auth.verifySSA(token);
        if (!email) {
            res.json(403, {error: 'bad_user'});
            done();
            return;
        }

        user.getUserIDFromEmail(client, email, function(err, resp) {
            if (err || !resp) {
                res.json(500, {error: err || 'db_error'});
                done();
                return;
            }
            var POST = req.params;
            var slug = utils.slugify(POST.slug || POST.name);
            var data = {
                _id: slug + '~' + utils._id(),
                app_url: POST.app_url,
                name: POST.name,
                slug: slug,
                userID: resp
            };
            db.flatfile.write('app', slug, data);
            res.json({sucess: true});
            done();
        });
    }));
};
