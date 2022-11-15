import { insertAdhocValidation } from '../database/db.js';

function endWithBadResponse(context, message = 'Bad Request', status = 400) {
    context.log.error(message);
    context.bindings.response = {
        status,
        body: message,
    };
}

function getBoundary(header) {
    const items = header.split(';');
    if (items) {
        for (let i = 0; i < items.length; i += 1) {
            const item = items[i].trim();
            if (item.indexOf('boundary') >= 0) {
                const k = item.split('=');
                return k[1].trim();
            }
        }
    }
    return '';
}

// eslint-disable-next-line consistent-return
export default async function pvtPostAdhocFile(context, req) {
    try {
        const { body, query, headers } = req;
        if (!body) {
            return endWithBadResponse(context, `No IATI file attached`);
        }

        if (!query.filename) {
            return endWithBadResponse(context, `No filename apparent`);
        }

        if (!query.sessionId) {
            return endWithBadResponse(context, `No sessionId apparent`);
        }

        if (!query.guid) {
            return endWithBadResponse(context, `No guid apparent`);
        }

        if (!headers['content-type'].includes('multipart/form-data')) {
            return endWithBadResponse(
                context,
                `Expect Request Content-Type to be multipart/form-data`
            );
        }

        const boundary = Buffer.from(getBoundary(headers['content-type']));
        const boundaryBuf = Buffer.from(`\r\n--${boundary}`);

        const contentTypeStart = body.indexOf('Content-Type: ');
        const contentTypeEnd = body.indexOf('\r\n\r\n', contentTypeStart);
        const formContentType = body
            .slice(contentTypeStart + 'Content-Type: '.length, contentTypeEnd)
            .toString();
        const startIndex = body.indexOf(boundary);

        if (!['text/xml', 'application/xml'].includes(formContentType)) {
            return endWithBadResponse(
                context,
                `Expect form data Content-Type to be text/xml or application/xml`
            );
        }
        if (startIndex > contentTypeStart) {
            return endWithBadResponse(context, `Couldn't parse form data`);
        }

        const endIndex = body.indexOf(boundaryBuf);

        const result = body.slice(contentTypeEnd + '\r\n\r\n'.length, endIndex);

        if (result.length < 1) {
            return endWithBadResponse(context, `File in request body is empty.`);
        }
        context.bindings.storage = result;

        await insertAdhocValidation(req.query.sessionId, req.query.filename, req.query.guid);
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
}
