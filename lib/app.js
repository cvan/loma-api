var _ = require('lodash');
var uuid = require('node-uuid');

var utils = require('./utils');


function newApp(client, data) {
    data.id = uuid.v4();
    client.hset('apps', data.id, JSON.stringify(data));
    client.hset('appsBySlug', data.slug, data.id);
    return data;
}
exports.newApp = newApp;


function updateApp(client, data, opts) {
    var newData = _.extend(_.clone(data), opts);
    client.hset('apps', newData.id, JSON.stringify(newData));
    if (data.slug !== newData.slug) {
        client.hset('appsBySlug', newData.slug, newData.id);
        client.hdel('appsBySlug', data.slug);
    }

    return newData;
}
exports.updateApp = updateApp;


function getAppFromID(client, id, callback) {
    /*
    `callback` is called with an error parameter and a parameter
    containing a JSON blob of app data.
    */
    client.hget('apps', id, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_app');
        } else {
            callback(null, JSON.parse(resp));
        }
    });
}
exports.getAppFromID = getAppFromID;


function getAppFromSlug(client, slug, callback) {
    getAppIDFromSlug(client, slug, function(err, id) {
        if (err && err !== 'no_such_app') {
            callback(err);
        } else if (!id) {
            callback(null, null);
        } else {
            getAppFromID(client, id, callback);
        }
    });
}
exports.getAppFromSlug = getAppFromSlug;


function getAppIDFromSlug(client, slug, callback) {
    client.hget('appsBySlug', slug, function(err, resp) {
        if (err) {
            callback('db_error');
        } else if (!resp) {
            callback('no_such_app');
        } else {
            // `resp` is the app ID.
            callback(null, resp);
        }
    });
}
exports.getAppIDFromSlug = getAppIDFromSlug;


function publicAppObj(full) {
    return _.pick(full, [
        '_id',
        'app_url',
        'category',
        'created',
        'keywords',
        'id',
        'name',
        'slug',
        'user_id'
    ]);
}
exports.publicAppObj = publicAppObj;


function getPublicAppObj(client, id, callback) {
    // `callback` is called with a single parameter, which is either
    // the public app object or `null`.
    getAppFromID(client, id, function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        try {
            callback(null, publicAppObj(resp));
        } catch(e) {
            callback(null);
        }
    });
}
exports.getPublicAppObj = getPublicAppObj;


function getPublicAppObjList(client, ids, callback) {
    // `callback` is called with a single parameter, which is an
    // array of public app objects. If any result is invalid, it
    // is not included.
    if (!ids.length) {
        callback([]);
        return;
    }
    client.hmget(['apps'].concat(ids), function(err, resp) {
        if (err || !resp) {
            callback(null);
            return;
        }
        callback(resp.map(function(full) {
            if (!full) return;
            try {
                return publicAppObj(JSON.parse(full));
            } catch(e) {
            }
        }).filter(_.identity));
    });
}
exports.getPublicAppObjList = getPublicAppObjList;
