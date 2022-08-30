import { getPublishersWithBlackFlag } from '../database/db.js';

export default async function pvtGetPublishersFlagged(context) {
    try {
        const result = await getPublishersWithBlackFlag();

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
