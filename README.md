# loma-api

API for loma (list of mobile apps).


## Installation

* `npm install`
* `cp settings_local.js.dist settings_local.js`
* `nodemon app.js`


## Sample Usage

### App Submission

    curl -X POST 'http://localhost:5000/app/submit' -d 'name=Open Table&app_url=http://m.opentable.com'

### App Details

    curl 'http://localhost:5000/app/open-table/detail'

### App Manifest JSON (Firefox)

    curl 'http://localhost:5000/app/open-table/manifest'

### App Manifest Launcher

    curl 'http://localhost:5000/launch.html?https://m.opentable.com'
