# loma-api

API for loma (list of mobile apps).


# Installation

* `npm install`
* `cp settings_local.js.dist settings_local.js`
* `cp settings_local.js.dist settings_prod.js`
* `nodemon app.js`


# Sample usage

## App submission

    curl -X POST 'http://localhost:5000/app/submit' -d 'name=Open Table&app_url=http://m.opentable.com'

## Populate with sample data

The following script makes for each web site a POST request to the submission
API endpoint, fetches the content of that web site, and stores a search
document in the database:

    ./scripts/populate.sh


# Deployment

We use stackato:

    stackato push --no-prompt

To start the instance on stackato:

    stackato start

To read the logs on stackato:

    stackato logs

To run shell commands on stackato:

    stackato run cat ../logs/stdout.log
