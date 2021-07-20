const { Pool } = require('pg');
const config = require('../config/config');

module.exports = {
    query: async (sql, values = null) => {
        const pool = new Pool(config.PGCONFIG);
        const result = await pool.query(sql, values);
        await pool.end();

        return result.rows;
    },

    getFirstRow: async (sql, values = null) => {
        const pool = new Pool(config.PGCONFIG);
        const result = await pool.query(sql, values);
        await pool.end();

        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    },

    getReportForUrl: async (url) => {
        const sql = `
            SELECT document_hash as registry_hash, document_id as registry_id, document_url, valid, report
            FROM validation
            WHERE document_url = $1
        `;

        return module.exports.getFirstRow(sql, [url]);
    },

    getReportForHash: async (hash) => {
        const sql = `
            SELECT document_hash as registry_hash, document_id as registry_id, document_url, valid, report
            FROM validation
            WHERE document_hash = $1
        `;
        return module.exports.getFirstRow(sql, [hash]);
    },

    getReportForId: async (id) => {
        const sql = `
            SELECT document_hash as registry_hash, document_id as registry_id, document_url, valid, report
            FROM validation
            WHERE document_id = $1
        `;
        return module.exports.getFirstRow(sql, [id]);
    },

    getPublishersWithDocuments: async () => {
        const sql = `
            SELECT org_id, name, title, state, country_code, package_count, iati_id
            FROM publisher
            WHERE package_count > 0
        `;
        return module.exports.query(sql);
    },

    getAllPublishers: async () => {
        const sql = `
            SELECT org_id, name, description, title, state, image_url, country_code, package_count, iati_id
            FROM publisher
        `;
        return module.exports.query(sql);
    },

    getDocumentsForPublisher: async (id) => {
        const sql = `
        SELECT 
            doc.id, 
            doc.hash, 
            doc.url, 
            doc.first_seen, 
            doc.downloaded,
            doc.download_error,
            doc.validation,
            doc.publisher,
            doc.modified,
            val.created as validation_created, 
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.document_hash
        WHERE doc.publisher = $1
        ORDER BY url ASC
        `;
        return module.exports.query(sql, [id]);
    },

    getSinglePublisherById: async (id) => {
        const sql = `
        SELECT
            org_id,
            name,
            description,
            title,
            state,
            image_url,
            country_code,
            package_count,
            iati_id
        FROM publisher
        WHERE org_id = $1
        `;
        return module.exports.query(sql, [id]);
    },

    getSinglePublisherByName: async (name) => {
        const sql = `
        SELECT
            org_id,
            name,
            description,
            title,
            state,
            image_url,
            country_code,
            package_count,
            iati_id
        FROM publisher
        WHERE name = $1
        `;
        return module.exports.query(sql, [name]);
    },

    getSingleDocument: async (id) => {
        const sql = `
        SELECT
            doc.id,
            doc.hash,
            doc.url,
            doc.first_seen,
            doc.downloaded,
            doc.download_error,
            doc.validation,
            doc.publisher,
            doc.modified,
            val.created as validation_created,
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.document_hash
        WHERE doc.id = $1
        `;
        return module.exports.query(sql, [id]);
    },

    getDsStyleDocuments: async () => {
        const sql = `
        SELECT 
            doc.hash, 
            doc.url, 
            doc.first_seen as date_created, 
            doc.last_seen as date_updated,
            pub.name as publisher_name
        FROM document as doc
        LEFT JOIN publisher as pub ON doc.publisher = pub.org_id
        WHERE downloaded IS NOT NULL;
        `;

        const result = await module.exports.query(sql);

        for (let i = 0; i < result.length; i += 1) {
            result[i].name = result[i].url.split('/').pop();
        }

        return result;
    },

    getAdhocValidationSession: async (sessionId) => {
        const sql = `
        SELECT 
            hash, 
            report, 
            valid,
            session_id,
            id
        FROM adhoc_validation
        WHERE session_id = $1
        `;

        const result = await module.exports.query(sql, [sessionId]);

        return result;
    },

    insertAdhocValidation: async (hash, sessionId) => {
        const sql = `
        INSERT INTO adhoc_validation (hash, session_id, created) VALUES ($1, $2, $3)
        `;

        const now = new Date();

        const result = await module.exports.query(sql, [hash, sessionId, now.toISOString()]);

        return result;
    },

    updateAdhocValidationWithReport: async (hash, report, valid) => {
        const sql = `
        UPDATE adhoc_validation SET report = $1, valid = $2 WHERE hash = $3
        `;

        const result = await module.exports.query(sql, [report, valid, hash]);

        return result;
    },
};
