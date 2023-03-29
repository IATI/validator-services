import {
    getReportForId,
    getReportForHash,
    getReportForUrl,
    getReportForName,
    getReportForTestfile,
    getReportWithoutErrorsForId,
    getReportWithoutErrorsForHash,
    getReportWithoutErrorsForUrl,
    getReportWithoutErrorsForName,
} from '../database/db.js';
import { constructCSV } from '../utils/utils.js';

export default async function pubGetReport(context, req) {
    const { id, hash, url, name, testfile, showerrors, format } = req.query;

    // showErrors - default - true
    // whether to return the whole errors object in the JSON report response
    const showErrors = (showerrors ? showerrors.toLowerCase() : showerrors) !== 'false';

    // outputFormat - default - json
    // whether to return JSON or CSV
    let outputFormat = 'json';
    if (format) {
        if (format.toLowerCase() === 'csv') {
            outputFormat = 'csv';
        }
    }

    if (!id && !url && !hash && !name && !testfile) {
        const message = {
            client_error:
                'Either the id, url, hash or name of the document as obtained from the IATI Registry must be supplied as a GET parameter',
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

        if (showErrors) {
            if (id) {
                result = await getReportForId(id);
            } else if (hash) {
                result = await getReportForHash(hash);
            } else if (url) {
                result = await getReportForUrl(url);
            } else if (name) {
                result = await getReportForName(name);
            } else if (testfile) {
                result = await getReportForTestfile(testfile);
            }
        } else if (id) {
            result = await getReportWithoutErrorsForId(id);
        } else if (hash) {
            result = await getReportWithoutErrorsForHash(hash);
        } else if (url) {
            result = await getReportWithoutErrorsForUrl(url);
        } else if (name) {
            result = await getReportWithoutErrorsForName(name);
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

        if (result.report === null) {
            const message = {
                client_error:
                    'The requested report has not yet been generated - please try again later.',
            };

            context.res = {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            };

            return;
        }

        if (outputFormat === 'json') {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            };
        } else {
            const csvText = await constructCSV([result]);
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'text/csv' },
                body: csvText,
            };
        }

        return;
    } catch (e) {
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
        };
    }
}
