const fetch = require('node-fetch');
const db = require('../database/db');
const { checkRespStatus } = require('../utils/utils');

function endWithBadResponse(context, body = { message: 'Bad Request' }, status = 400) {
    context.log.error(body.message);
    context.bindings.response = {
        headers: { 'Content-Type': 'application/json' },
        status,
        body,
    };
    context.done();
}

// eslint-disable-next-line consistent-return
module.exports = async (context, req) => {
    try {
        if (!req.query.url) {
            return endWithBadResponse(context, { messge: `No filename apparent` });
        }

        if (!req.query.sessionId) {
            return endWithBadResponse(context, { message: `No sessionId apparent` });
        }

        if (!req.query.guid) {
            return endWithBadResponse(context, `No guid apparent`);
        }

        let result;
        try {
            result = await fetch(req.query.url);
        } catch (err) {
            const message = `Error fetching from provided URL: ${err.message}`;
            endWithBadResponse(context, { message, url: req.query.url, code: err.code }, 422);
        }

        try {
            checkRespStatus(result);
        } catch (err) {
            const message = `Error fetching from provided URL: ${err.message}`;
            const errorBody = await err.response.text();
            endWithBadResponse(context, { message, errorBody, url: req.query.url }, 422);
        }

        context.bindings.storage = await result.text();

        await db.insertAdhocValidation(req.query.sessionId, req.query.url, req.query.guid);
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
};
