import pg from 'pg';
import config from '../config/config.js';

const { Pool } = pg;

const query = async (sql, values = null) => {
    const pool = new Pool(config.PGCONFIG);
    const result = await pool.query(sql, values);
    await pool.end();

    return result.rows;
};

const getFirstRow = async (sql, values = null) => {
    const pool = new Pool(config.PGCONFIG);
    const result = await pool.query(sql, values);
    await pool.end();

    if (result.rows.length > 0) {
        return result.rows[0];
    }
    return null;
};

const getReportForUrl = async (url) => {
    const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id,
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.url = $1;
        `;

    return getFirstRow(sql, [url]);
};

const valReportSummaryOnly = `(SELECT case when val.report is null then null else jsonb_build_object(
                                    'valid',val.report->'valid',
                                    'summary',val.report->'summary',
                                    'fileType',val.report->'fileType',
                                    'iatiVersion',val.report->'iatiVersion'
                                ) end as report)`;

const getReportWithoutErrorsForUrl = async (url) => {
    const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id, 
                   doc.name as registry_name, 
                   val.document_url,
                   val.valid,
                   ${valReportSummaryOnly}
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.url = $1;
        `;

    return getFirstRow(sql, [url]);
};

const getReportForTestfile = async (guid) => {
    const sql = `
            SELECT valid, report, filename, guid, session_id
            FROM adhoc_validation
            WHERE guid = $1
        `;

    return getFirstRow(sql, [guid]);
};

const getReportForHash = async (hash) => {
    const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id,
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.hash = $1
            ORDER BY val.id DESC
            LIMIT 1;
        `;
    return getFirstRow(sql, [hash]);
};

const getReportWithoutErrorsForHash = async (hash) => {
    const sql = `
            SELECT val.document_hash as registry_hash, 
                   val.document_id as registry_id, 
                   doc.name as registry_name,
                   val.document_url,
                   val.valid, 
                   ${valReportSummaryOnly}
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.hash = $1
            ORDER BY val.id DESC
            LIMIT 1;
        `;
    return getFirstRow(sql, [hash]);
};

const getReportForId = async (id) => {
    const sql = `
            SELECT val.document_hash as registry_hash, 
                   val.document_id as registry_id,
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.id = $1;
        `;
    return getFirstRow(sql, [id]);
};

const getReportWithoutErrorsForId = async (id) => {
    const sql = `
            SELECT val.document_hash as registry_hash,
                   val.document_id as registry_id, 
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   ${valReportSummaryOnly}
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.id = $1;
        `;
    return getFirstRow(sql, [id]);
};

const getReportForName = async (name) => {
    const sql = `
            SELECT val.document_hash as registry_hash, 
                   val.document_id as registry_id,
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   val.report
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.name = $1;
        `;
    return getFirstRow(sql, [name]);
};

const getReportWithoutErrorsForName = async (name) => {
    const sql = `
            SELECT val.document_hash as registry_hash, 
                   val.document_id as registry_id,
                   doc.name as registry_name,
                   val.document_url,
                   val.valid,
                   ${valReportSummaryOnly}
            FROM public.document as doc
            LEFT JOIN validation as val ON doc.validation=val.id
            WHERE doc.name = $1;
        `;
    return getFirstRow(sql, [name]);
};

const getPublishersWithDocuments = async () => {
    const sql = `
            SELECT org_id, name, title, state, country_code, package_count, iati_id, black_flag, black_flag_notified
            FROM publisher
            WHERE package_count > 0
        `;
    return query(sql);
};

const getPublishersWithBlackFlag = async () => {
    const sql = `
            SELECT org_id, name, description, title, state, image_url, country_code, package_count, iati_id, black_flag, black_flag_notified
            FROM publisher
            WHERE black_flag is not Null
        `;
    return query(sql);
};

const getDocumentsForPublisher = async (id) => {
    const sql = `
        SELECT 
            doc.id, 
            doc.hash, 
            doc.url, 
            doc.name, 
            doc.first_seen, 
            doc.downloaded,
            doc.download_error,
            doc.file_schema_valid,
            doc.validation,
            doc.regenerate_validation_report,
            doc.publisher,
            doc.modified,
            doc.solrize_end,
            doc.clean_start,
            doc.clean_end,
            doc.clean_error,
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
    return query(sql, [id]);
};

const getSinglePublisherById = async (id) => {
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
    return query(sql, [id]);
};

const getSinglePublisherByName = async (name) => {
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
    return query(sql, [name]);
};

const getSingleDocumentForId = async (id) => {
    const sql = `
        SELECT
            doc.id,
            doc.hash,
            doc.url,
            doc.name,
            doc.first_seen,
            doc.downloaded,
            doc.download_error,
            doc.file_schema_valid,
            doc.validation,
            doc.regenerate_validation_report,
            doc.publisher,
            doc.modified,
            doc.solrize_end,
            doc.clean_start,
            doc.clean_end,
            doc.clean_error,
            val.created as validation_created,
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.id
        WHERE doc.id = $1
        `;
    return query(sql, [id]);
};
const getSingleDocumentForName = async (name) => {
    const sql = `
        SELECT
            doc.id,
            doc.hash,
            doc.url,
            doc.name,
            doc.first_seen,
            doc.downloaded,
            doc.download_error,
            doc.file_schema_valid,
            doc.validation,
            doc.regenerate_validation_report,
            doc.publisher,
            doc.modified,
            doc.solrize_end,
            doc.clean_start,
            doc.clean_end,
            doc.clean_error,
            val.created as validation_created,
            val.valid,
            val.report -> 'summary' AS summary
        FROM document as doc
        LEFT JOIN validation AS val ON doc.validation = val.id
        WHERE doc.name = $1
        `;
    return query(sql, [name]);
};

const getAdhocValidationSession = async (sessionId) => {
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

    const result = await query(sql, [sessionId]);

    return result;
};

const insertAdhocValidation = async (sessionId, filename, guid) => {
    const sql = `
        INSERT INTO adhoc_validation (session_id, filename, guid) VALUES ($1, $2, $3)
        `;

    const result = await query(sql, [sessionId, filename, guid]);

    return result;
};

const updateAdhocValidation = async (guid, sessionId, valid, report, created, errorStatus) => {
    const sql = `
       UPDATE adhoc_validation 
       SET valid=$1, report=$2, created=$3, validated=$4, validation_api_error=$5
       WHERE guid=$6 and session_id=$7
        `;

    const now = new Date();

    const result = await query(sql, [
        valid,
        JSON.stringify(report),
        created,
        now.toISOString(),
        errorStatus,
        guid,
        sessionId,
    ]);

    return result;
};

const updateRegenerateValidationForIds = async (ids) => {
    const sql = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE
            validation is not Null
            AND id = ANY($1)
        `;

    await query(sql, [ids]);
};

const updateRegenerateValidationForAll = async () => {
    const sql = `
        UPDATE document
        SET 
            regenerate_validation_report = 't'
        WHERE validation is not Null
        `;

    const result = await query(sql);

    return result;
};

const getSummaryPrecalcStats = async (date, publisher) => {
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

        const result = await query(sql, [date, publisher]);
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

    const result = await query(sql, [date]);
    return result;
};

const getSummaryAggregateStats = async (date, publisher) => {
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

        const result = await query(sql, [date, publisher]);
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

    const result = await query(sql, [date]);
    return result;
};

const getMessageDateStats = async (date) => {
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

    const result = await query(sql, [date]);
    return result;
};

const getMessagePublisherStats = async (date, publisher) => {
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

    const result = await query(sql, [date, publisher]);
    return result;
};

export {
    query,
    getFirstRow,
    getReportForUrl,
    getReportWithoutErrorsForUrl,
    getReportForTestfile,
    getReportForHash,
    getReportWithoutErrorsForHash,
    getReportForId,
    getReportWithoutErrorsForId,
    getReportForName,
    getReportWithoutErrorsForName,
    getPublishersWithDocuments,
    getPublishersWithBlackFlag,
    getDocumentsForPublisher,
    getSinglePublisherById,
    getSinglePublisherByName,
    getSingleDocumentForId,
    getSingleDocumentForName,
    getAdhocValidationSession,
    insertAdhocValidation,
    updateAdhocValidation,
    updateRegenerateValidationForIds,
    updateRegenerateValidationForAll,
    getSummaryPrecalcStats,
    getSummaryAggregateStats,
    getMessageDateStats,
    getMessagePublisherStats,
};
