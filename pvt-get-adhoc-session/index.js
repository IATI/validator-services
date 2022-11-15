import { getAdhocValidationSession } from '../database/db.js';

function endWithBadResponse(context, message = 'Bad Request') {
    context.log.error(message);
    context.bindings.response = {
        status: 400,
        body: message,
    };
    context.done();
}

export default async function pvtGetAdhocSession(context, req) {
    try {
        if (!req.query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        const result = await getAdhocValidationSession(req.query.sessionId);

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };

        return true;
    } catch (e) {
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
        };

        return true;
    }
}
