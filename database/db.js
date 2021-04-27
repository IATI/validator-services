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
};
