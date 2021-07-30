const db = require('../database/db');

module.exports = async (context, req) => {
    const { id } = req.query;
    const { hash } = req.query;
    const { url } = req.query;
    const { testfile } = req.query;

    if (!id && !url && !hash && !testfile) {
        const message = {
            client_error:
                'Either the id, url or hash of the document as obtained from the IATI Registry must be supplied as a GET parameter',
        };

        context.res = {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        };

        return;
    }
    try {
        let result = null;

        if (id) {
            result = await db.getReportForId(id);
        } else if (hash) {
            result = await db.getReportForHash(hash);
        } else if (url) {
            result = await db.getReportForUrl(url);
        } else if (testfile) {
            result = await db.getReportForTestfile(testfile);
        }

        if (result === null) {
            const message = { client_error: 'The requested report does not exist.' };

            context.res = {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            };

            return;
        }

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };

        return;
    } catch (e) {
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
        };
    }
};
