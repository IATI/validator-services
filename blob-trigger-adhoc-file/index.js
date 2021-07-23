const axios = require('axios');
const db = require('../database/db');
const config = require('../config/config');

module.exports = async (context) => {
    let errorStatus = null;
    let result = null;
    let valid = null;
    let report = null;

    try {
        result = await axios.post(config.VALIDATOR_API_URL, context.bindings.myBlob.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'x-functions-key': config.VALIDATOR_FUNC_KEY,
            },
        });
    } catch (err) {
        if (!err.response.status) {
            context.log.error(err.message);
            throw err;
        }

        errorStatus = err.response.status;
        result = err.response;
    }

    try {
        const ids = context.bindingData.name.split('###');
        const sessionId = ids[0];
        const filename = ids[1];
        const guid = ids[2];

        if (!errorStatus || (errorStatus >= 400 && errorStatus < 500)) {
            report = result.data;

            if (report.summary.critical > 0) {
                valid = false;
            } else {
                valid = true;
            }
        }

        const { created } = context.bindingData.properties;

        await db.insertAdhocValidation(
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
