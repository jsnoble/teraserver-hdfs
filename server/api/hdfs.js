//'use strict';
var hdfsClient = require('node-webhdfs').WebHDFSClient;
var utils = require('./hdfs-utils');


module.exports = function (config) {
    var endpoint = config.server_config.teraserver_hdfs;

    return function (req, res) {
        var ticketIsValid = utils.checkTicket(req, endpoint);

        if (!ticketIsValid) {
            res.status(401).json({error: 'invalid ticket for endpoint'})
        }
        else {
            var query = utils.validateQuery(req, endpoint);

            // notifying client that range is permissible
            res.set('Accept-Ranges', 'bytes');

            if (!query.isValid) {
                res.status(400).json(query.error)
            }
            else {
                var endpointConfig = utils.formatConfig(endpoint[req.params.id]);
                var client = new hdfsClient(endpointConfig);

                //adjust byteInterval to change how big the slice is, set to 1 megabyte
                var byteInterval = 1000000;

                client.getFileStatus(query.path, function (err, bytes) {
                    if (err) {
                        res.send(utils.processError(err));
                    }
                    else {
                        var range = utils.processHeaders(req, res, bytes);
                        var reqOptions = range ? {offset: range.start, length: range.end - range.start} : {};
                        var statusCode = range ? range.statusCode : 200;
                        var startByte = range ? range.start : 0;

                    //if less then byteInterval just send file
                        if (bytes.length < byteInterval) {

                            utils.getData(client, query.path, reqOptions)
                                .then(function (data) {
                                    res.status(statusCode).send(data);
                                });
                        }
                        else {
                            var getChunks = utils.getChunks;

                            getChunks(client, query, res, startByte, byteInterval, bytes.length, statusCode);

                        }
                    }

                });

            }
        }
    }
};