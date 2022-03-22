const { parse } = require('qs');
const fetch = require('node-fetch');

module.exports = async (context, req) => {
    const payload = JSON.parse(parse(req.rawBody).payload);
    if (payload.actions[0].action_id === 'remove_black_flag_from_publisher') {
        const buttonPayload = JSON.parse(payload.actions[0].value);
        context.log(
            `Removing ${buttonPayload.publisherName}: ${buttonPayload.publisherId} from black flag list`
        );
        // Do DB operation

        try {
            await fetch(payload.response_url, {
                method: 'POST',
                body: JSON.stringify({
                    text: `Publisher ${buttonPayload.publisherName}: ${buttonPayload.publisherId} successfully removed from black flag list`,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            context.error(error);
            context.res = {
                status: 500,
            };
        }
        context.res = {
            status: 200,
        };
    }
};
