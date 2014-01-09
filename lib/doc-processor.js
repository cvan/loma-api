// TODO: Move this into its own repo.

var fs = require('fs');
var path = require('path');
var urllib = require('url');

var _ = require('lodash');
var cheerio = require('cheerio');
var glossary = require('glossary');
var iconsnaggle = require('iconsnaggle');
var Promise = require('es6-promise').Promise;
var request = require('request');

var utils = require('./utils');


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

function processDoc(doc) {
    // TODO: Consider extracting metadata from both desktop+mobile versions.
    var $ = cheerio.load(doc.body);
    doc = {
        _id: doc._id,
        app_url: doc.app_url,
        category: doc.category,
        html_title: ($('title').text() || '').trim(),
        keywords: getKeywords(),
        name: doc.name,
        slug: doc.slug
    };

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
               'meta[property^="og:"]';
    $(meta).each(function(i, e) {
        var $meta = $(e);
        var name = $meta.attr('name') || $meta.attr('property');
        var content = $meta.attr('content');
        if (name && content) {
            doc['meta_' + name.toLowerCase()] = content.trim();
        }
    });

    doc.icon = getBestIcon(doc.app_url, doc.body);

    return doc;
}


var promises = [];

fs.readFile('data/app-raw-docs.json', function(err, data) {
    JSON.parse(data).forEach(function(doc) {
        promises.push(new Promise(function(resolve, reject) {
            // TODO: Consider using phantom to scrape page.
            request.get(doc.app_url, function(err, response, body) {
                console.log('Fetching', doc.name, '<' + doc.app_url + '>');
                doc.body = body;
                doc = processDoc(doc);
                resolve(doc);
            });
        }));
    });

    var fnDocs = path.resolve('data/app-processed-docs.json');

    Promise.all(promises).then(function(apps) {
        // TODO: Save each doc to separate file when processed.
        fs.writeFile(fnDocs, JSON.stringify(apps), 'utf8', function(err, data) {
            if (err) {
                console.error('Error creating', fnLisfnDocs + ':', err);
            }
            console.log('Done updating:', fnDocs);
        });
    }).then(console.log, console.error);
});
