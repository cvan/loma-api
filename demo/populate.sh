#!/bin/bash

PORT=${PORT-5000}
api_url='http://localhost:'${PORT}
submit_url=${api_url}'/app/submit'

submit_app() {
    curl -X POST ${submit_url} -d "${1}"
    echo
}

submit_app "name=A List Apart&app_url=http://alistapart.com/"
submit_app 'name=CSS-Tricks&app_url=http://css-tricks.com/'
submit_app 'name=Codepen&app_url=http://codepen.io/'
submit_app 'name=Currys&app_url=http://www.currys.co.uk/'
submit_app 'name=Disney&app_url=http://disney.com/'
submit_app 'name=Facebook&app_url=http://facebook.com/'
submit_app 'name=Fray&app_url=http://fray.com/'
submit_app 'name=GitHub&app_url=http://github.com/'
submit_app 'name=Heroku Status&app_url=https://status.heroku.com/'
submit_app 'name=Lotta Nieminen&app_url=http://www.lottanieminen.com/'
submit_app 'name=Marketplace&app_url=https://marketplace.firefox.com/'
submit_app 'name=Microsoft&app_url=http://www.microsoft.com/'
submit_app 'name=Open Table&app_url=http://opentable.com/'
submit_app 'name=Polygon&app_url=http://www.polygon.com/'
submit_app 'name=Starbucks&app_url=http://www.starbucks.com/'
submit_app 'name=Tattly&app_url=http://tattly.com/'
submit_app 'name=The Next Web&app_url=http://thenextweb.com/'
submit_app 'name=The Shape of Design&app_url=http://www.shapeofdesignbook.com/'
submit_app 'name=Time&app_url=http://time.com/'
submit_app 'name=Twitter&app_url=http://twitter.com/'
submit_app 'name=United Pixel Workers&app_url=http://www.unitedpixelworkers.com/'
submit_app 'name=Wikipedia&app_url=http://wikipedia.com/'
