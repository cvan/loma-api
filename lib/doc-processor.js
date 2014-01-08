// TODO: Move this into its own repo.

var fs = require('fs');
var path = require('path');
var urllib = require('url');

var _ = require('lodash');
var cheerio = require('cheerio');
var glossary = require('glossary');
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

function processDoc(doc) {
    // TODO: Consider extracting metadata from both desktop+mobile versions.
    // TODO: Consider extracting body and whitelisting meta tags.
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
        return _.uniq(keywords);
    }

    function getKeywords() {
        var sentences = $('p').text().replace(/\s+/g, ' ');
        keywords = cleanKeywords(glossary.extract(sentences));
        keywords.concat($('header li, .header li, nav li, h1, h2, h3').map(function() {
            return (this.innerText || '').trim();
        }));
        return _.filter(keywords, function(value) { return !!value; });
    }

    $('meta').each(function(i, e) {
        var meta = $(e);
        if (meta.attr('name') && meta.attr('content')) {
            var name = meta.attr('name').toLowerCase();
            doc['meta_' + name] = meta.attr('content');
        }
    });

    function getIcon() {
        var $this = $(this);
        var data = {
            url: urllib.resolve(doc.app_url, $this.attr('href'))
        };
        var size = ($this.attr('sizes') || '').split('x');
        if (size) {
            data.width = size[0];
            data.height = size[1];
        }
        return data;
    }

    function $map(selector, cb) {
        var $el = $(selector);
        return $el.length ? $el.map(cb) : [];
    }

    doc.icons = {
        favicons: [],
        shortcutIcons: $map('link[rel="shortcut icon"]', getIcon),
        icons: $map('link[rel="icon"]', getIcon),
        appleTouchIcons: $map('link[rel="apple-touch-icon"]', getIcon),
        appleTouchIconsPrecomposed: $map(
            'link[rel="apple-touch-icon-precomposed"]', getIcon),
        ogImages: $map('link[rel="og:image"]', getIcon)
    };

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
