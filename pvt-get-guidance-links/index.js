const config = require('../config/config');

module.exports = async (context, req) => {
    try {
        const { version } = req.params;

        if (!config.VERSIONS.includes(version)) {
            context.res = {
                status: 422,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    error: true,
                    message: `Version '${version}' of the IATI Standard is not supported. Supported versions: ${config.VERSIONS.join(
                        ', '
                    )}`,
                },
            };
            return;
        }

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(version),
        };
        return;
    } catch (e) {
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
        };
    }
};
