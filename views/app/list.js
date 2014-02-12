var applib = require('../../lib/app');
var db = require('../../db');


module.exports = function(server) {
    // Sample usage:
    // % curl 'http://localhost:5000/app/list'
    server.get({
        url: '/app/list',
        swagger: {
            nickname: 'list',
            notes: 'List of all apps submitted',
            summary: 'List of apps'
        }
    }, db.redisView(function(client, done, req, res, wrap) {
        var GET = req.params;
        var sortAsc = GET.sort === 'asc';

        var page = GET.page ? parseInt(GET.page, 10) : 0;
        var limit = GET.limit ? parseInt(GET.limit, 10) : 10;

        var start = page * limit;
        var stop = start + limit - 1;

        var zRangeFunc = sortAsc ? 'zrange': 'zrevrange';

        function outputResult(result) {
            if (!result || !result.length) {
                res.json([]);
                done();
                return;
            }

            var appIds = result.map(function(app) {
                return app;
            });

            applib.getPublicAppObjList(client, appIds, function(objs) {
                res.json(objs.map(function(obj) {
                    return obj;
                }));
                done();
            });
        }

        var arguments = ['appsList', start, stop];
        client[zRangeFunc](arguments, db.plsNoError(res, done, function(scores) {
            outputResult(scores);
        }));
    }));
};
