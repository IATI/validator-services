import { getReportsForPublisher } from '../database/db.js';
import { constructCSV } from '../utils/utils.js';

export default async function pvtGetPublishersReports(context, req) {
    const { format } = req.query;

    // outputFormat - default - json
    // whether to return JSON or CSV
    let outputFormat = 'json';
    if (format) {
        if (format.toLowerCase() === 'csv') {
            outputFormat = 'csv';
        }
    }

    try {
        const results = await getReportsForPublisher(req.params.id);
        if (outputFormat === 'json') {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results),
            };

            return;
        }
        const csvText = await constructCSV(results);
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'text/csv' },
            body: csvText,
        };
    } catch (e) {
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
        };
    }
}
