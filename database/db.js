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
            SELECT org_id, name, description, title, state, image_url, country_code, package_count, iati_id
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
            val.created as validation_created, 
            val.valid
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.document_hash
        WHERE doc.publisher = $1
        ORDER BY url ASC
        `;
        return module.exports.query(sql, [id]);
    },
};
