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

    getReportWithoutErrorsForUrl: async (url) => {
        const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id, 
                   val.document_url,
                   val.valid,
                   (SELECT case when val.report is null then null else jsonb_build_object(
                        'valid',val.report->'valid',
                        'summary',val.report->'summary',
                        'fileType',val.report->'fileType',
                        'iatiVersion',val.report->'iatiVersion'
                    ) end as report)
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

    getReportWithoutErrorsForHash: async (hash) => {
        const sql = `
            SELECT document_hash as registry_hash, document_id as registry_id, document_url, valid, 
                (SELECT case when report is null then null else jsonb_build_object(
                        'valid',report->'valid',
                        'summary',report->'summary',
                        'fileType',report->'fileType',
                        'iatiVersion',report->'iatiVersion'
                    ) end as report)
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

    getReportWithoutErrorsForId: async (id) => {
        const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id, 
                   val.document_url,
                   val.valid,
                   (SELECT case when val.report is null then null else jsonb_build_object(
                        'valid',val.report->'valid',
                        'summary',val.report->'summary',
                        'fileType',val.report->'fileType',
                        'iatiVersion',val.report->'iatiVersion'
                    ) end as report)
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.id = $1;
        `;
        return module.exports.getFirstRow(sql, [id]);
    },

    getPublishersWithDocuments: async () => {
        const sql = `
            SELECT org_id, name, title, state, country_code, package_count, iati_id, black_flag, black_flag_notified
            FROM publisher
            WHERE package_count > 0
        `;
        return module.exports.query(sql);
    },

    getPublishersWithBlackFlag: async () => {
        const sql = `
            SELECT org_id, name, description, title, state, image_url, country_code, package_count, iati_id, black_flag, black_flag_notified
            FROM publisher
            WHERE black_flag is not Null
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
            doc.alv_start,
            doc.alv_end,
            doc.alv_error,
            val.created as validation_created, 
            val.valid,
            (SELECT case when val.report is null then null else jsonb_build_object(
                'valid',val.report->'valid',
                'summary',val.report->'summary',
                'fileType',val.report->'fileType',
                'iatiVersion',val.report->'iatiVersion'
            ) end as report)
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
            doc.solrize_end,
            doc.alv_start,
            doc.alv_end,
            doc.alv_error,
            val.created as validation_created,
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.id
        WHERE doc.id = $1
        `;
        return module.exports.query(sql, [id]);
    },

    getAdhocValidationSession: async (sessionId) => {
        const sql = `
        SELECT 
            guid,
            filename, 
            (SELECT case when report is null then null 
                else jsonb_build_object(
                    'valid',report->'valid',
                    'summary',report->'summary',
                    'fileType',report->'fileType',
                    'iatiVersion',report->'iatiVersion'
            ) end as report), 
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

    insertAdhocValidation: async (sessionId, filename, guid) => {
        const sql = `
        INSERT INTO adhoc_validation (session_id, filename, guid) VALUES ($1, $2, $3)
        `;

        const result = await module.exports.query(sql, [sessionId, filename, guid]);

        return result;
    },

    updateAdhocValidation: async (guid, sessionId, valid, report, created, errorStatus) => {
        const sql = `
       UPDATE adhoc_validation 
       SET valid=$1, report=$2, created=$3, validated=$4, validation_api_error=$5
       WHERE guid=$6 and session_id=$7
        `;

        const now = new Date();

        const result = await module.exports.query(sql, [
            valid,
            JSON.stringify(report),
            created,
            now.toISOString(),
            errorStatus,
            guid,
            sessionId,
        ]);

        return result;
    },

    updateRegenerateValidationForIds: async (ids) => {
        // Non ALV Docs
        const sql1 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE
            id = ANY($1)
            AND alv_end is null
            AND alv_error is null;
        `;

        // ALV Docs
        const sql2 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't',
            solrize_reindex = 't',
            lakify_start = null,
            lakify_end = null,
            lakify_error = null,
            flatten_end = null,
            flatten_start = null,
            flattened_activities = null,
            flatten_api_error = null,
            alv_revalidate = 't',
            downloaded = null,
            download_error = null
        WHERE
            id = ANY($1)
            AND alv_end is not null;
        `;

        // ALV Docs (errored so not in DS)
        const sql3 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't',
            alv_revalidate = 't',
            downloaded = null,
            download_error = null
        WHERE
            id = ANY($1)
            AND alv_end is null 
            AND alv_error is not null;
        `;

        await module.exports.query(sql1, [ids]);
        await module.exports.query(sql2, [ids]);
        await module.exports.query(sql3, [ids]);
    },

    updateRegenerateValidationForAll: async () => {
        // Non ALV Docs
        const sql1 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE
            validation is not Null
            AND alv_end is null
            AND alv_error is null;
        `;

        // ALV Docs
        const sql2 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't',
            solrize_reindex = 't',
            lakify_start = null,
            lakify_end = null,
            lakify_error = null,
            flatten_end = null,
            flatten_start = null,
            flattened_activities = null,
            flatten_api_error = null,
            alv_revalidate = 't',
            downloaded = null,
            download_error = null
        WHERE
            validation is not Null
            AND alv_end is not null;
        `;

        // ALV Docs (errored so not in DS)
        const sql3 = `
        UPDATE document
        SET 
            regenerate_validation_report = 't',
            alv_revalidate = 't',
            downloaded = null,
            download_error = null
        WHERE
            validation is not Null
            AND alv_end is null 
            AND alv_error is not null;
        `;

        await module.exports.query(sql1);
        await module.exports.query(sql2);
        await module.exports.query(sql3);
    },

    getSummaryPrecalcStats: async (date, publisher) => {
        if (publisher) {
            const sql = `
            SELECT
                T1.publisher_name,
                SUM( (T1.report -> 'summary' ->> 'critical') :: INTEGER) as critical,
                SUM( (T1.report -> 'summary' ->> 'error') :: INTEGER) as error,
                SUM( (T1.report -> 'summary' ->> 'warning') :: INTEGER) as warning
            FROM validation AS T1
            WHERE T1.created <= $1
            AND T1.publisher_name = $2
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            )
            GROUP BY T1.publisher_name;
            `;

            const result = await module.exports.query(sql, [date, publisher]);
            return result;
        }
        const sql = `
            SELECT
                T1.publisher_name,
                SUM( (T1.report -> 'summary' ->> 'critical') :: INTEGER) as critical,
                SUM( (T1.report -> 'summary' ->> 'error') :: INTEGER) as error,
                SUM( (T1.report -> 'summary' ->> 'warning') :: INTEGER) as warning
            FROM validation AS T1
            WHERE T1.created <= $1
            AND T1.publisher_name IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            )
            GROUP BY T1.publisher_name;
            `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getSummaryAggregateStats: async (date, publisher) => {
        if (publisher) {
            const sql = `
                SELECT
                    T1.publisher_name,
                    arr3.item_object -> 'severity' AS severity,
                    SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
                FROM validation AS T1,
                JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
                JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
                JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
                WHERE T1.created <= $1
                AND T1.publisher_name = $2
                AND T1.report IS NOT NULL
                AND NOT EXISTS(
                    SELECT * FROM validation AS T2
                    WHERE T2.created <= $1
                    AND T2.document_id = T1.document_id
                    AND T2.created > T1.created
                ) GROUP BY T1.publisher_name, severity;
            `;

            const result = await module.exports.query(sql, [date, publisher]);
            return result;
        }
        const sql = `
            SELECT
                T1.publisher_name,
                arr3.item_object -> 'severity' AS severity,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND T1.report IS NOT NULL
            AND T1.publisher_name IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY T1.publisher_name, severity;
        `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getMessageDateStats: async (date) => {
        const sql = `
            SELECT
                T1.publisher_name,
                arr3.item_object -> 'id' AS error_id,
                arr3.item_object -> 'message' AS message,
                arr3.item_object -> 'severity' AS severity,
                arr2.item_object -> 'category' as category,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND T1.report IS NOT NULL
            AND T1.publisher_name IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY T1.publisher_name, error_id, message, severity, category;
        `;

        const result = await module.exports.query(sql, [date]);
        return result;
    },

    getMessagePublisherStats: async (date, publisher) => {
        const sql = `
            SELECT
                T1.publisher_name,
                arr3.item_object -> 'id' AS error_id,
                arr3.item_object -> 'message' AS message,
                arr3.item_object -> 'severity' AS severity,
                arr2.item_object -> 'category' as category,
                SUM( JSONB_ARRAY_LENGTH(arr3.item_object -> 'context') ) AS count
            FROM validation AS T1,
            JSONB_ARRAY_ELEMENTS(T1.report -> 'errors') WITH ORDINALITY arr(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr.item_object -> 'errors') WITH ORDINALITY arr2(item_object, position),
            JSONB_ARRAY_ELEMENTS(arr2.item_object -> 'errors') WITH ORDINALITY arr3(item_object, position)
            WHERE T1.created <= $1
            AND T1.publisher_name = $2
            AND T1.report IS NOT NULL
            AND NOT EXISTS(
                SELECT * FROM validation AS T2
                WHERE T2.created <= $1
                AND T2.document_id = T1.document_id
                AND T2.created > T1.created
            ) GROUP BY T1.publisher_name, error_id, message, severity, category;
        `;

        const result = await module.exports.query(sql, [date, publisher]);
        return result;
    },
};
