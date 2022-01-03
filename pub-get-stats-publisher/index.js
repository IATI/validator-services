const db = require('../database/db');

module.exports = async (context, req) => {
    const date = req.query.date ? req.query.date : '9999-01-01';
    const { publisher } = req.params;
    const { format } = req.query;

    if (!publisher) {
        const message = {
            client_error:
                'The publisher for the validation report must be supplied as a GET parameter',
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

        result = await db.getMessagePublisherStats(date, publisher);

        if (format === 'csv') {
            const csvString = [
                ['publisher_name', 'id', 'message', 'severity', 'category', 'count'],
                ...result.map((item) => [
                    item.publisher_name,
                    item.id,
                    item.message,
                    item.severity,
                    item.category,
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
                const { id, message, severity, count, category } = row;
                if (!Object.keys(parsedResults).includes(publisherName)) {
                    parsedResults[publisherName] = {};
                }
                parsedResults[publisherName][id] = {};
                parsedResults[publisherName][id].count = count;
                parsedResults[publisherName][id].message = message;
                parsedResults[publisherName][id].severity = severity;
                parsedResults[publisherName][id].category = category;
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
