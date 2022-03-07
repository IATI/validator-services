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
            SELECT val.document_hash as registry_hash, val.document_id as registry_id, val.document_url, val.valid, val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.url = $1;
        `;

        return module.exports.getFirstRow(sql, [url]);
    },

    getReportForTestfile: async (guid) => {
        const sql = `
            SELECT valid, report, filename, guid, session_id
            FROM adhoc_validation
            WHERE guid = $1
        `;

        return module.exports.getFirstRow(sql, [guid]);
    },

    getReportForHash: async (hash) => {
        const sql = `
            SELECT document_hash as registry_hash, document_id as registry_id, document_url, valid, report
            FROM validation
            WHERE document_hash = $1
            ORDER BY id DESC
            LIMIT 1
        `;
        return module.exports.getFirstRow(sql, [hash]);
    },

    getReportForId: async (id) => {
        const sql = `
            SELECT val.document_hash as registry_hash, val.document_id as registry_id, val.document_url, val.valid, val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.id = $1;
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
            doc.regenerate_validation_report,
            doc.publisher,
            doc.modified,
            doc.solrize_end,
            val.created as validation_created, 
            val.valid,
            val.report
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.id
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
            doc.regenerate_validation_report,
            doc.publisher,
            doc.modified,
            val.created as validation_created,
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.id
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
            guid,
            filename, 
            report, 
            valid,
            session_id,
            created,
            validated
        FROM adhoc_validation
        WHERE session_id = $1
        ORDER BY created desc
        `;

        const result = await module.exports.query(sql, [sessionId]);

        return result;
    },

    insertAdhocValidation: async (sessionId, filename) => {
        const sql = `
        INSERT INTO adhoc_validation (session_id, filename) VALUES ($1, $2)
        `;

        const result = await module.exports.query(sql, [sessionId, filename]);

        return result;
    },

    updateAdhocValidation: async (
        guid,
        sessionId,
        filename,
        valid,
        report,
        created,
        errorStatus
    ) => {
        const sql = `
       UPDATE adhoc_validation 
       SET guid=$1, valid=$2, report=$3, created=$4, validated=$5, validation_api_error=$6
       WHERE session_id=$7 AND filename=$8
        `;

        const now = new Date();

        const result = await module.exports.query(sql, [
            guid,
            valid,
            JSON.stringify(report),
            created,
            now.toISOString(),
            errorStatus,
            sessionId,
            filename,
        ]);

        return result;
    },

    updateRegenerateValidationForIds: async (ids) => {
        const sql = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE
            id = ANY($1);
        `;

        const result = await module.exports.query(sql, [ids]);

        return result;
    },

    updateRegenerateValidationForAll: async () => {
        const sql = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE validation is not Null
        `;

        const result = await module.exports.query(sql);

        return result;
    },

    getSummaryPrecalcStats: async (date, publisher) => {
        if (publisher) {
            const sql = `
            SELECT
                publisher.name as publisher_name,
                SUM( (T1.report -> 'summary' ->> 'critical') :: INTEGER) as critical,
                SUM( (T1.report -> 'summary' ->> 'error') :: INTEGER) as error,
                SUM( (T1.report -> 'summary' ->> 'warning') :: INTEGER) as warning
            FROM validation AS T1
            LEFT JOIN publisher
                ON T1.publisher = publisher.org_id
            WHERE T1.created <= $1
            AND publisher.name = $2
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            )
            GROUP BY publisher.name;
            `;

            const result = await module.exports.query(sql, [date, publisher]);
            return result;
        }
        const sql = `
            SELECT
                publisher.name as publisher_name,
                SUM( (T1.report -> 'summary' ->> 'critical') :: INTEGER) as critical,
                SUM( (T1.report -> 'summary' ->> 'error') :: INTEGER) as error,
                SUM( (T1.report -> 'summary' ->> 'warning') :: INTEGER) as warning
            FROM validation AS T1
            LEFT JOIN publisher
                ON T1.publisher = publisher.org_id
            WHERE T1.created <= $1
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            )
            GROUP BY publisher.name;
            `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getSummaryAggregateStats: async (date, publisher) => {
        if (publisher) {
            const sql = `
                SELECT
                    publisher.name AS publisher_name,
                    arr3.item_object -> 'severity' AS severity,
                    SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
                FROM validation AS T1
                LEFT JOIN publisher
                    ON T1.publisher = publisher.org_id,
                JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
                JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
                JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
                WHERE T1.created <= $1
                AND publisher.name = $2
                AND T1.report IS NOT NULL
                AND NOT EXISTS(
                    SELECT * FROM validation AS T2
                    WHERE T2.created <= $1
                    AND T2.document_id = T1.document_id
                    AND T2.created > T1.created
                ) GROUP BY publisher.name, severity;
            `;

            const result = await module.exports.query(sql, [date, publisher]);
            return result;
        }
        const sql = `
            SELECT
                publisher.name AS publisher_name,
                arr3.item_object -> 'severity' AS severity,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1
            LEFT JOIN publisher
                ON T1.publisher = publisher.org_id,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND T1.report IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY publisher.name, severity;
        `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getMessageDateStats: async (date) => {
        const sql = `
            SELECT
                publisher.name AS publisher_name,
                arr3.item_object -> 'id' AS id,
                arr3.item_object -> 'message' AS message,
                arr3.item_object -> 'severity' AS severity,
                arr2.item_object -> 'category' as category,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1
            LEFT JOIN publisher
                ON T1.publisher = publisher.org_id,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND T1.report IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY publisher.name, id, message, severity, category;
        `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getMessagePublisherStats: async (date, publisher) => {
        const sql = `
            SELECT
                publisher.name AS publisher_name,
                arr3.item_object -> 'id' AS id,
                arr3.item_object -> 'message' AS message,
                arr3.item_object -> 'severity' AS severity,
                arr2.item_object -> 'category' as category,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1
            LEFT JOIN publisher
                ON T1.publisher = publisher.org_id,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND publisher.name = $2
            AND T1.report IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY publisher.name, id, message, severity, category;
        `;

        const result = await module.exports.query(sql, [date, publisher]);
        return result;
    },
};
