const db = require('../database/db');

module.exports = async (context, req) => {
    const start = req.query.start ? req.query.start : '0001-01-01';
    const end = req.query.end ? req.query.end : '9999-01-01';
    const { publisher } = req.query;
    const { format } = req.query;

    try {
        let result = null;

        result = await db.getSummaryStats(start, end, publisher);

        if (format === 'csv') {
            const csvString = [
                ['publisher_name', 'critical', 'error', 'warning'],
                ...result.map((item) => [
                    item.publisher_name,
                    item.critical,
                    item.error,
                    item.warning,
                ]),
            ]
                .map((e) => e.join(','))
                .join('\n');
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'text/csv' },
                body: csvString,
            };
        } else {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
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
