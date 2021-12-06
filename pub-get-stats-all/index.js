const db = require('../database/db');

module.exports = async (context, req) => {
    const date = req.query.date ? req.query.date : '9999-01-01';
    const { format } = req.query;

    try {
        let result = null;

        result = await db.getMessageDateStats(date);

        if (format === 'csv') {
            const csvString = [
                ['publisher_name', 'id', 'message', 'severity', 'count'],
                ...result.map((item) => [
                    item.publisher_name,
                    item.id,
                    item.message,
                    item.severity,
                    item.count,
                ]),
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
                const { id, message, severity, count } = row;
                if (!Object.keys(parsedResults).includes(publisherName)) {
                    parsedResults[publisherName] = {};
                }
                parsedResults[publisherName][id] = {};
                parsedResults[publisherName][id].count = count;
                parsedResults[publisherName][id].message = message;
                parsedResults[publisherName][id].severity = severity;
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
