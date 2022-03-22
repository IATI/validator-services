const { parse } = require('qs');
const fetch = require('node-fetch');
const db = require('../database/db');

module.exports = async (context, req) => {
    const parsedBody = parse(req.rawBody);
    if ('payload' in parsedBody) {
        const payload = JSON.parse(parse(req.rawBody).payload);
        context.log(payload);
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
        if (payload.actions[0].action_id === 'remove_black_flag_from_publisher_multiple') {
            const selectedPublishers = payload.actions[0].selected_options;

            context.log(selectedPublishers);
            // Do DB operation to Unblackflag

            const respBody = {
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: ':waving_black_flag: Black Flag Removed from Publishers:',
                        },
                    },
                    {
                        type: 'divider',
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${selectedPublishers
                                .map((pub, i) => `${i + 1}. ${pub.text.text}`)
                                .join('\n')}`,
                        },
                    },
                ],
            };

            try {
                await fetch(payload.response_url, {
                    method: 'POST',
                    body: JSON.stringify(respBody),
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
    } else if ('command' in parsedBody) {
        if (parsedBody.command === '/flagged-publishers') {
            // get publishers from DB
            const result = await db.getPublishersWithDocuments();

            const publisherOptions = result.slice(0, 10).map((publisher) => ({
                text: {
                    type: 'plain_text',
                    text: `${publisher.title} - ${publisher.iati_id}`,
                    emoji: true,
                },
                value: publisher.org_id,
            }));
            context.log(publisherOptions);
            const messageBody = {
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: ':waving_black_flag: Black Flagged Publishers',
                        },
                    },
                    {
                        type: 'divider',
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: 'Select Publishers to remove black flag',
                        },
                        accessory: {
                            type: 'multi_static_select',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select publishers',
                                emoji: true,
                            },
                            options: [...publisherOptions],
                            action_id: 'remove_black_flag_from_publisher_multiple',
                        },
                    },
                ],
            };
            try {
                await fetch(parsedBody.response_url, {
                    method: 'POST',
                    body: JSON.stringify(messageBody),
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
    }
};
