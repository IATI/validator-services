const axios = require('axios');
const db = require('../database/db');
const config = require('../config/config');

module.exports = async (context) => {
    try {
        const result = await axios.post(
            config.VALIDATOR_API_URL,
            context.bindings.myBlob.toString(),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-functions-key': config.VALIDATOR_FUNC_KEY,
                },
            }
        );
        const ids = context.bindingData.name.split('-');
        const sessionId = ids[0];
        const guid = ids[1];

        let valid = null;
        const report = result.data;

        if (report.summary.critical > 0) {
            valid = false;
        } else {
            valid = true;
        }

        await db.insertAdhocValidation(guid, sessionId, valid, report);
        context.done();
    } catch (err) {
        context.log.error(err.message);
        throw err;
    }
};
