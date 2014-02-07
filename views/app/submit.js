var db = require('../../db');
var utils = require('../../lib/utils');


module.exports = function(server) {
    // Sample usage:
    // % curl -X POST 'http://localhost:5000/app/submit' -d 'name=Open Table&app_url=http://m.opentable.com'
    server.post({
        url: '/app/submit',
        swagger: {
            nickname: 'submit',
            notes: 'Submit app',
            summary: 'Submission'
        },
        validation: {
            app_url: {
                description: 'App URL',
                isRequired: true,
                isUrl: true
            },
            homepage_url: {
                description: 'Homepage URL',
                isRequired: false,
                isUrl: true
            },
            icons: {
                description: 'Icons',
                isRequired: false,
            },
            name: {
                description: 'Name',
                isRequired: true,
                max: 128
            },
            screenshots: {
                description: 'Screenshots',
                isRequired: false
            },
            category: {
                description: 'Category',
                isRequired: false
            }
        }
    }, function(req, res) {
        console.log(req.headers);
        var POST = req.params;
        slug = utils.slugify(POST.slug || POST.name);
        var data = {
            _id: slug + '~' + utils._id(),
            app_url: POST.app_url,
            appcache_path: POST.appcache_path,
            category: POST.category,
            default_locale: POST.default_locale,
            description: POST.description,
            developer_name: POST.developer_name,
            developer_url: POST.developer_url,
            fullscreen: POST.fullscreen,
            homepage_url: POST.homepage_url,
            icons: POST.icons,
            license: POST.license,
            locales: POST.locales,
            name: POST.name,
            orientation: POST.orientation,
            privacy: POST.privacy_policy,
            screenshots: POST.screenshots,
            slug: slug
        };
        db.flatfile.write('app', slug, data);
        res.json(data);
    });
};
