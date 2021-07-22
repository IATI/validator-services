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
        const ids = context.bindingData.name.split('###');
        const sessionId = ids[0];
        const filename = ids[1];
        const guid = ids[2];

        let valid = null;
        const report = result.data;

        if (report.summary.critical > 0) {
            valid = false;
        } else {
            valid = true;
        }

        const {created} = context.bindingData.properties;

        await db.insertAdhocValidation(guid, sessionId, filename, valid, report, created);
        context.done();
    } catch (err) {
        // TOMORROW catch Axios errors and handle them properly
        context.log.error(err.message);
        throw err;
    }
};
