var _ = require('lodash');

var applib = require('../../lib/app');
var auth = require('../../lib/auth');
var db = require('../../db');
var searchlib = require('../../lib/search');
var userlib = require('../../lib/user');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X PATCH 'http://localhost:5000/app' -d 'name=Open Table&app_url=http://m.opentable.com'
    server.patch({
        url: '/app',
        swagger: {
            nickname: 'submit',
            notes: 'Submit app',
            summary: 'Submission'
        },
        validation: {
            // TODO: Throw an error if there's no existing app_url in the db.
            app_url: {
                description: 'App URL',
                isRequired: false,
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
            // TODO: Allow a way to change a slug.
            slug: {
                description: 'Slug',
                isRequired: true
            },
            id: {
                description: 'ID',
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

            // TODO: Also check if user is the developer who submitted app.
            if (!(user.permissions.admin || user.permissions.reviewer)) {
                res.json(403, {error: 'bad_permission'});
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

            if (!slug) {
                res.json(400, {error: 'bad_app'});
                return done();
            }

            applib.getAppFromSlug(client, slug, function(err, app) {
                if (!app) {
                    res.json(500, {error: 'db_error'});
                    return done();
                }

                var dataToUpdate = {
                    // TODO: Consider removing `_id` in favour of `id`.
                    _id: slug + '~' + utils._id(),
                    modified: new Date()
                };

                ['app_url', 'category', 'keywords', 'name'].forEach(function(v) {
                    if (v in POST) {
                        dataToUpdate[v] = POST[v];
                    }
                });

                // TODO: Allow a way of changing ownership (`user_id`).
                // TODO: Allow a way of changing slug (`slug`).

                var doc = _.merge(app, dataToUpdate);
                searchlib.processDoc(doc).then(function(data) {
                    doc.doc = data;
                    applib.updateApp(client, {id: doc.id}, newDoc, function(err, doc) {
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
        });
    }));
};
