var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/acl' -d 'id=1&dev=1&reviewer=1&admin=0'
    // TODO: Make sure only admins can do this
    server.post({
        url: '/user/acl',
        validation: {
            id: {
                description: 'User ID of user for whom to change permissions',
                isRequired: true
            },
            dev: {
                description: 'Whether or not user should have developer permissions',
                isRequired: true
            },
            reviewer: {
                description: 'Whether or not user should have reviewer permissions',
                isRequired: false
            },
            admin: {
                description: 'Whether or not user should have admin permissions',
                isRequired: false
            }
        },
        swagger: {
            nickname: 'acl',
            notes: 'Update User Permissions',
            summary: 'ACL'
        }
    }, db.redisView(function(client, done, req, res) {
        var token = req.headers.token;
        var email = auth.verifySSA(token);
        if (!email) {
            res.json(403, {error: 'bad_user'});
            return done();
        }

        userlib.getUserFromEmail(client, email, function(err, user) {
            if (err) {
                console.error(err);
                res.json(500, {error: 'db_error'});
                return done();
            } else if (!user) {
                console.error('Failed looking up user');
                res.json(500, {error: 'bad_user'});
                return done();
            }

            if (!user.permissions.admin) {
                res.json(403, {error: 'bad_permission'});
                return done();
            }

            var POST = req.params;

            var userID = POST.id;

            console.log('Attempting permission update');

            user.getUserFromID(client, userID, function(err, resp) {
                if (err || !resp) {
                    res.json(500, {error: err || 'db_error'});
                    return done();
                }

                // Convert from string to boolean.
                var isDev = !!+POST.dev;
                var isRev = !!+POST.reviewer;
                var isAdmin = !!+POST.admin;

                user.updateUser(client, resp, {
                    permissions: {
                        developer: isDev,
                        reviewer: isRev,
                        admin: isAdmin
                    }
                }, function(err, newData) {
                    if (err) {
                        res.json(500, {error: err});
                    } else {
                        res.json({permissions: newData.permissions});
                    }
                    done();
                });
            });
        });
    }));
};
