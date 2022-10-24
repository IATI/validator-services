import { getSinglePublisherById, getSinglePublisherByName } from '../database/db.js';

export default async function pvtGetSinglePublisher(context, req) {
    try {
        const { lookupKey } = req.query;
        const { lookupValue } = req.params;

        if (lookupKey !== 'id' && lookupKey !== 'name') {
            const message = {
                client_error:
                    'Either id or name must be supplied as the lookupKey GET query parameter.',
            };

            context.res = {
                status: 422,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            };

            return;
        }
        if (!lookupValue) {
            const message = {
                client_error:
                    'Either id or name of the publisher - as obtained from the IATI Registry - must be supplied in the URL',
            };

            context.res = {
                status: 422,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            };

            return;
        }
        let result = null;

        if (lookupKey === 'id') {
            result = await getSinglePublisherById(lookupValue);
        } else if (lookupKey === 'name') {
            result = await getSinglePublisherByName(lookupValue);
        }

        if (result.length === 0) {
            const message = {
                client_error: `Cannot find publisher with ${lookupKey}: ${lookupValue}`,
            };

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
}
