const fetch = require('node-fetch');
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
        if (!req.query.url) {
            return endWithBadResponse(context, `No filename apparent`);
        }

        if (!req.query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        const result = await fetch(req.query.url);

        context.bindings.storage = await result.text();

        await db.insertAdhocValidation(req.query.sessionId, req.query.url);
        return context.done();
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
};
