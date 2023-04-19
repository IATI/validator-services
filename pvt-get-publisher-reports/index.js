import { getReportsForPublisher } from '../database/db.js';

export default async function pvtGetPublishersReports(context, req) {
    try {
        const result = await getReportsForPublisher(req.params.id);

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
}
