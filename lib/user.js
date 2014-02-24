var _ = require('lodash');
var crypto = require('crypto');

var uuid = require('node-uuid');

var utils = require('./utils');


const MAX_LEADERBOARD_INCR = 10;
const TIME_UPDATE_PLAYTIME = 1000 * 60 * 5;  // 5 minutes



function newUser(client, email, vouched) {
    var userData = {
        username: email.split('@')[0],
        email: email,
        permissions: {
            developer: false,
            reviewer: false,
            admin: false
        },
        id: uuid.v4(),
        dateRegistered: utils.now(),
        dateLastLogin: utils.now(),
        vouched: vouched || false
    };
    client.hset('users', userData.id, JSON.stringify(userData));
    client.hset('usersByEmail', email, userData.id);
    // TODO: Figure out a way to store users by username.
    return userData;
}
exports.newUser = newUser;


function updateUser(client, userData, opts) {
    var newUserData = _.extend(_.clone(userData), opts);
    // Only update the modified timestamp if anything but the lastLogin
    // timestamp has changed.
    if (!_.isEqual(_.omit(userData, 'dateLastLogin'),
                   _.omit(newUserData, 'dateLastLogin'))) {
        newUserData.datelastModified = utils.now();
    }
    client.hset('users', newUserData.id, JSON.stringify(newUserData));
    if (userData.email !== newUserData.email) {
        client.hset('usersByEmail', newUserData.email, newUserData.id);
    }
    return newUserData;
}
exports.updateUser = updateUser;


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
        id: full.id,
        vouched: full.vouched
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
