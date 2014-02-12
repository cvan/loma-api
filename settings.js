var _ = require('lodash');


exports.ORIGIN = 'http://localhost:9000';

_.extend(exports, require('./settings_local'));

if (process.env.PROD) {
    _.extend(exports, require('./settings_prod'));
}
