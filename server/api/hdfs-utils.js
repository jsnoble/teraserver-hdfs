'use strict';
var urlParser = require('url');

exports.validateQuery = function (req, endpoint) {

    var isValid = true;
    var error = [];
    var parsedUrl = urlParser.parse(req.url);
    var path = parsedUrl.pathname;
    var endpointConfig = endpoint[req.params.id];


    if (!endpointConfig) {
        isValid = false;
        error.push(' endpoint does not exist ');
    }
    if (path.length < 2) {
        isValid = false;
        error.push(' filepath in url is required ');
    }
    if (path.match(/\.\./)) {
        isValid = false;
        error.push(' cannot use ".." in file path ');
    }
    if (req.query.ticket !== endpointConfig.ticket) {
        isValid = false;
        error.push(' invalid ticket for endpoint ')
    }

    return {isValid: isValid, path: path, error: {error: error.join(' | ')}}
};