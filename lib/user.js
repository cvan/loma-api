var crypto = require('crypto');

var uuid = require('node-uuid');


const MAX_LEADERBOARD_INCR = 10;
const TIME_UPDATE_PLAYTIME = 1000 * 60 * 5;  // 5 minutes


function now() {
    // Returns a UNIX timestamp.
    return Math.floor((new Date()).getTime() / 1000);
}

function newUser(client, email) {
    var userData = {
        username: email.split('@')[0],
        email: email,
        id: uuid.v4()
    };
    client.hset('users', userData.id, JSON.stringify(userData));
    client.hset('usersByEmail', email, userData.id);
    // TODO: Figure out a way to store users by username.
    return userData;
}
exports.newUser = newUser;


function getUserFromID(client, id, callback) {
    /*
    `callback` is called with an error parameter and a parameter
    containing a JSON blob of user data.
    */
    client.hget('users', id, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_user');
        } else {
            callback(null, JSON.parse(resp));
        }
    });
}
exports.getUserFromID = getUserFromID;


function getUserFromEmail(client, email, callback) {
    console.log('looking up user');
    getUserIDFromEmail(client, email, function(err, id) {
        if (err && err !== 'no_such_user') {
            callback(err);
        } else if (!id) {
            callback(null, null);
        } else {
            getUserFromID(client, id, callback);
        }
    });
}
exports.getUserFromEmail = getUserFromEmail;


function getUserIDFromEmail(client, email, callback) {
    client.hget('usersByEmail', email, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_user');
        } else {
            // `resp` is the user ID.
            callback(null, resp);
        }
    });
}
exports.getUserIDFromEmail = getUserIDFromEmail;


function getGravatarURL(email) {
    return 'http://www.gravatar.com/avatar/' + crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}
exports.getGravatarURL = getGravatarURL;


function publicUserObj(full) {
    return {
        avatar: getGravatarURL(full.email),
        username: full.username,
        id: full.id
    };
}
exports.publicUserObj = publicUserObj;

function getPublicUserObj(client, id, callback) {
    // `callback` is called with a single parameter, which is either
    // the public user object or `null`.
    client.hget('users', id, function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        try {
            callback(publicUserObj(JSON.parse(resp)));
        } catch(e) {
            callback(null);
        }
    });
}
exports.getPublicUserObj = getPublicUserObj;


function getPublicUserObjList(client, ids, callback) {
    // `callback` is called with a single parameter, which is an
    // array of public user objects. If any result is invalid, it
    // is not included.
    if (!ids.length) {
        callback([]);
        return;
    }
    client.hmget(['users'].concat(ids), function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        callback(resp.map(function(full) {
            if (!full) return;
            try {
                return publicUserObj(JSON.parse(full));
            } catch(e) {
                return;
            }
        }).filter(function(x) {return x;}));
    });
}
exports.getPublicUserObjList = getPublicUserObjList;
