const db = require('../database/db');

module.exports = async (context, req) => {
    const date = req.query.date ? req.query.date : '9999-01-01';
    const { publisher } = req.query;
    const { format } = req.query;

    try {
        let result = null;

        result = await db.getSummaryStats(date, publisher);

        if (format === 'csv') {
            const csvString = [
                ['publisher_name', 'severity', 'count'],
                ...result.map((item) => [item.publisher_name, item.severity, item.count]),
            ]
                .map((e) => e.map((c) => `"${c}"`).join(','))
                .join('\n');
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'text/csv' },
                body: csvString,
            };
        } else {
            const parsedResults = {};

            result.forEach((row) => {
                const publisherName = row.publisher_name;
                if (!Object.keys(parsedResults).includes(publisherName)) {
                    parsedResults[publisherName] = {};
                }
                if (!Object.keys(parsedResults[publisherName]).includes('critical')) {
                    parsedResults[publisherName].critical = 0;
                }
                if (!Object.keys(parsedResults[publisherName]).includes('error')) {
                    parsedResults[publisherName].error = 0;
                }
                if (!Object.keys(parsedResults[publisherName]).includes('warning')) {
                    parsedResults[publisherName].warning = 0;
                }
                parsedResults[publisherName][row.severity] = parseInt(row.count, 10);
            });

            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedResults),
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
};
