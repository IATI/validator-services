const multipart = require('parse-multipart');
const db = require('../database/db');

function endWithBadResponse(context, message = 'Bad Request', status = 400) {
    context.log.error(message);
    context.bindings.response = {
        status,
        body: message,
    };
    context.done();
}

module.exports = async (context, req) => {
    try {
        if (!req.body) {
            return endWithBadResponse(context, `No IATI file attached`);
        }

        if (!req.query.filename) {
            return endWithBadResponse(context, `No filename apparent`);
        }

        if (!req.query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        const bodyBuffer = await Buffer.from(req.body);

        const boundary = await multipart.getBoundary(req.headers['content-type']);

        const parts = await multipart.Parse(bodyBuffer, boundary);

        if (parts.length < 1) {
            return endWithBadResponse(
                context,
                `There would appear to be no file in the request body.`
            );
        }

        context.bindings.storage = parts[0].data;

        await db.insertAdhocValidation(req.query.sessionId, req.query.filename);
        return context.done();
    } catch (err) {
        // MONDAY log more error
        context.log.error(err.message);
        throw err;
    }
};
