var request = require('request');

var auth = require('../../lib/auth');
var db = require('../../db');
var settings = require('../../settings');
var userlib = require('../../lib/user');
var utils = require('../../lib/utils');

const MOZILLIANS_API_URL = 'https://mozillians.org/api/v1/users/?app_key=' +
    settings.MOZILLIANS_API_KEY + '&app_name=' + settings.MOZILLIANS_API_NAME;


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/user/login' -d 'assertion=&audience'
    server.post({
        url: '/user/login',
        swagger: {
            nickname: 'login',
            notes: 'Sign in via Persona',
            summary: 'Login'
        }
    }, function(req, res) {
        var POST = req.params;

        var assertion = POST.assertion;
        var audience = POST.audience || '';

        console.log('Attempting verification:', audience);

        auth.verifyPersonaAssertion(
            assertion,
            audience,
            function(err, body) {
                console.error(err);
                if (err) {
                    res.json(403, {error: 'bad_assertion'});
                    return;
                }

                console.log('Assertion verified.');
                // Establish the redis connection here so we don't flood the
                // server with connections that never get used.
                var client = db.redis();
                var email = body.email;

                function updateUserObj(err, resp) {
                    if (err) {
                        console.error(err);
                        res.json(500, {error: 'db_error'});
                        return client.end();
                    }

                    resp.avatar = userlib.getGravatarURL(email);
                    res.json({
                        error: null,
                        token: auth.createSSA(email),
                        settings: resp,
                        public: userlib.publicUserObj(resp),
                        permissions: {}
                    });
                    client.end();
                }

                userlib.getUserFromEmail(client, email, function(err, resp) {
                    if (err) {
                        res.json(500, {error: err});
                        return;
                    }
                    console.log('Contacting mozillians API');
                    request.get(MOZILLIANS_API_URL + '&email=' + email,
                                function(err, response, body) {
                        if (err) {
                            return res.json(500, {error: 'mozillians_api_error'});
                        }

                        body = JSON.parse(body || '{}');
                        var vouched = !!(body && body.objects && body.objects[0] && body.objects[0].is_vouched);

                        if (resp) {
                            userlib.updateUser(client, resp, {dateLastLogin: utils.now(), vouched: vouched}, updateUserObj);
                        } else {
                            userlib.newUser(client, email, vouched, updateUserObj);
                        }
                    });
                });
            }
        );
    });
};
