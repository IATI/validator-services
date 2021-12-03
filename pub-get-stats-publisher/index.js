const db = require('../database/db');

module.exports = async (context, req) => {
    const start = req.query.start ? req.query.start : '0001-01-01';
    const end = req.query.end ? req.query.end : '9999-01-01';
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

        result = await db.getMessagePublisherStats(start, end, publisher);

        const parsedResults = {};

        result.forEach((validationReport) => {
            const publisherName = validationReport.publisher_name;
            if (!Object.keys(parsedResults).includes(publisherName)) {
                parsedResults[publisherName] = {};
            }
            validationReport.report_errors.forEach((activity) => {
                activity.errors.forEach((errorCategory) => {
                    errorCategory.errors.forEach((error) => {
                        const { id } = error;
                        const instances = error.context.length;
                        const { message } = error;
                        const { severity } = error;
                        if (!Object.keys(parsedResults[publisherName]).includes(id)) {
                            parsedResults[publisherName][id] = {};
                            parsedResults[publisherName][id].count = instances;
                            parsedResults[publisherName][id].message = message;
                            parsedResults[publisherName][id].severity = severity;
                        } else {
                            parsedResults[publisherName][id].count += instances;
                        }
                    });
                });
            });
        });

        if (format === 'csv') {
            const flatParsedResults = [];
            Object.keys(parsedResults).forEach((publisherName) => {
                const errors = parsedResults[publisherName];
                Object.keys(errors).forEach((id) => {
                    const error = errors[id];
                    flatParsedResults.push({
                        publisher_name: publisherName,
                        id,
                        message: error.message,
                        severity: error.severity,
                        count: error.count,
                    });
                });
            });
            const csvString = [
                ['publisher_name', 'id', 'message', 'severity', 'count'],
                ...flatParsedResults.map((item) => [
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
