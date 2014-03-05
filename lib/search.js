var crypto = require('crypto');
var path = require('path');
var urllib = require('url');

var _ = require('lodash');
var cheerio = require('cheerio');
var glossary = require('glossary');
var Promise = require('es6-promise').Promise;
var request = require('request');

var settings = require('../settings');
var utils = require('../lib/utils');


request = request.defaults({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Mobile; rv:18.0) Gecko/18.0 Firefox/18.0'
    },
    timeout: 5000
});

var stopwords = [];

_.mixin({
    compactObject: function(o) {
        _.each(o, function(v, k) {
            if (_.isEmpty(v)) {
                delete o[k];
            }
        });
        return o;
    }
});

function getUrlboxURL(args) {
    var qs = utils.serialize(args);
    var token = crypto.createHmac('sha1', settings.URLBOX_API_SECRET).update(qs).digest('hex');
    return 'https://api.urlbox.io/v1/' + settings.URLBOX_API_KEY + '/' + token + '/png?' + qs;
}

function getScreenshotURL(url) {
    // TODO: Replace with firesnaggle URL (issue #12).
    return getUrlboxURL({width: 320, height: 480, url: url});
}

function processDoc(origDoc, body) {
    // TODO: Consider extracting metadata from both desktop+mobile versions.
    var $ = cheerio.load(body);
    var doc = _.pick(origDoc, [
        '_id',
        'app_url',
        'category',
        'created',
        'doc',
        'id',
        'keywords',
        'name',
        'slug',
        'user_id'
    ]);
    doc.html_title = ($('title').text() || '').trim();
    if (doc.keywords) {
        doc.keywords = doc.keywords.concat(getKeywords());
    } else {
        doc.keywords = getKeywords();
    }
    doc.screenshot_url = getScreenshotURL(doc.app_url);

    function cleanKeywords(keywords) {
        keywords = _.filter(keywords, function(keyword) {
            // If valid as long as it's not a stopword and
            // it's longer than one character.
            return !_.contains(stopwords, keyword) && keyword.length > 1;
        });
        return _.uniq(_.compact(keywords));
    }

    function getKeywords() {
        var sentences = $('p').text().replace(/\s+/g, ' ');
        keywords = glossary.extract(sentences);
        keywords.concat($('header li, .header li, nav li, h1, h2, h3').map(function() {
            return (this.innerText || '').trim();
        }));
        return cleanKeywords(keywords);
    }

    var meta = 'meta[name=keywords], ' +
               'meta[name=description], ' +
               'meta[property="og:description"], ' +
               'meta[property="og:title"]';
    $(meta).each(function(i, e) {
        var $meta = $(e);
        var name = $meta.attr('name') || $meta.attr('property');
        var content = $meta.attr('content');
        if (name && content) {
            doc['meta_' + name.toLowerCase()] = content.trim();
        }
    });

    return doc;
}


module.exports.processDoc = function(doc) {
    return new Promise(function(resolve, reject) {
        // TODO: Use phantomjs-extracted content (issue #3).
        request.get(doc.app_url, function(err, response, body) {
            if (err) {
                return reject(err);
            }
            console.log('Fetching', doc.name, '<' + doc.app_url + '>');
            resolve(processDoc(doc, body));
        });
    });
};
