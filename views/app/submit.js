var applib = require('../../lib/app');
var auth = require('../../lib/auth');
var db = require('../../db');
var searchlib = require('../../lib/search');
var userlib = require('../../lib/user');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/app' -d 'name=Open Table&app_url=http://m.opentable.com'
    server.post({
        url: '/app',
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
            name: {
                description: 'Name',
                isRequired: true
            },
            category: {
                description: 'Category',
                isRequired: false
            },
            keywords: {
                description: 'Keywords',
                isRequired: false
            },
            slug: {
                description: 'Slug',
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

        userlib.getUserFromEmail(client, email, function(err, user) {
            if (err || !user) {
                res.json(500, {error: err || 'db_error'});
                return done();
            }

            // Only vouched Mozillians should be able to submit sites.
            if (!user.vouched) {
                res.json(403, {error: 'unvouched_user'});
                return done();
            }

            var POST = req.params;
            // TODO: Check for only unique slug (issue #11).
            var slug = utils.slugify(POST.slug || POST.name);
            var doc = {
                // TODO: Consider removing `_id` in favour of `id`.
                _id: slug + '~' + utils._id(),
                app_url: POST.app_url,
                category: POST.category,
                created: new Date(),
                keywords: POST.keywords,
                name: POST.name,
                slug: slug,
                user_id: user.id
            };
            searchlib.processDoc(doc).then(function(data) {
                doc.doc = data;
                applib.newApp(client, doc, function(err, resp) {
                    if (err) {
                        res.json(400, {error: 'submit_save_error'});
                    } else {
                        res.json(doc);
                    }
                    done();
                });
            }).catch(function(err) {
                console.error(err);
                res.json(400, {error: 'submit_fetch_error'});
                done();
            });
        });
    }));
};
