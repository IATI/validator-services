const multipart = require('parse-multipart');
const db = require('../database/db');

function endWithBadResponse(context, message = 'Bad Request') {
    context.log.error(message);
    context.bindings.response = {
        status: 400,
        body: message,
    };
    context.done();
}

module.exports = (context, req) => {
    try {
        if (!req.body) {
            return endWithBadResponse(context, `No IATI file attached`);
        }

        if (!req.query.hash) {
            return endWithBadResponse(context, `No hash apparent`);
        }

        if (!req.query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        const bodyBuffer = Buffer.from(req.body);

        const boundary = multipart.getBoundary(req.headers['content-type']);
        const parts = multipart.Parse(bodyBuffer, boundary);

        context.bindings.storage = parts[0].data;
        context.done();

        return db.insertAdhocValidation(req.query.hash, req.query.sessionId);
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
};
