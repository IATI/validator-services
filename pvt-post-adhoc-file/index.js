const multipart = require('parse-multipart');

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

        if (!req.query.filename) {
            return endWithBadResponse(context, `No filename apparent`);
        }

        if (!req.query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        const bodyBuffer = Buffer.from(req.body);

        const boundary = multipart.getBoundary(req.headers['content-type']);
        const parts = multipart.Parse(bodyBuffer, boundary);

        context.bindings.storage = parts[0].data;
        return context.done();
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
};
