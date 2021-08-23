const fetch = require('node-fetch');
const db = require('../database/db');
const config = require('../config/config');

module.exports = async (context) => {
    let errorStatus = null;
    let result = null;
    let valid = null;
    let report = null;

    try {
        console.log('Blob Trigger: Making Validator request');

        result = await fetch(config.VALIDATOR_API_URL, {
            headers: {
                'Content-Type': 'application/json',
                'x-functions-key': config.VALIDATOR_FUNC_KEY,
            },
            body: context.bindings.myBlob.toString(),
            method: 'post',
        });
    } catch (err) {
        if (!err.response.status) {
            context.log.error(err.message);
            throw err;
        }

        errorStatus = err.response.status;

        if (errorStatus >= 500 || errorStatus === 404) {
            context.log.error(err.message);
            throw err;
        }

        result = err.response;
    }

    try {
        const ids = context.bindingData.name.split('###');
        const sessionId = ids[0];
        const filename = ids[1];
        const guid = ids[2];

        report = await result.json();

        if (Object.prototype.hasOwnProperty.call(report, 'summary')) {
            if (report.summary.critical > 0) {
                valid = false;
            } else {
                valid = true;
            }
        } else {
            report = null;
        }

        const { created } = context.bindingData.properties;

        console.log('Blob Trigger: Making DB update');

        await db.updateAdhocValidation(
            guid,
            sessionId,
            filename,
            valid,
            report,
            created,
            errorStatus
        );
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }

    context.done();
};
