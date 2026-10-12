import { getSummaryPrecalcStats } from "../database/db.js";

export default async function pubGetStatsSummaryPrecalc(context, req) {
  const date = req.query.date ? req.query.date : "9999-01-01";
  const { publisher } = req.query;
  const { format } = req.query;

  try {
    let result = null;

    result = await getSummaryPrecalcStats(date, publisher);

    if (format === "csv") {
      const csvString = [
        [
          "publisher_name",
          "critical",
          "error",
          "warning",
          "advisory",
          "documents_with_critical",
          "documents_with_error",
          "documents",
        ],
        ...result.map((item) => [
          item.publisher_name,
          item.critical,
          item.error,
          item.warning,
          item.advisory,
          item.documents_with_critical,
          item.documents_with_error,
          item.documents,
        ]),
      ]
        .map((e) => e.map((c) => `"${c}"`).join(","))
        .join("\n");
      context.res = {
        status: 200,
        headers: { "Content-Type": "text/csv" },
        body: csvString,
      };
    } else {
      const parsedResults = {};

      result.forEach((row) => {
        const publisherName = row.publisher_name;
        parsedResults[publisherName] = {
          critical: parseInt(row.critical, 10),
          error: parseInt(row.error, 10),
          warning: parseInt(row.warning, 10),
          advisory: parseInt(row.advisory, 10),
          documents_with_critical: parseInt(row.documents_with_critical, 10),
          documents_with_error: parseInt(row.documents_with_error, 10),
          documents: parseInt(row.documents, 10),
        };
      });

      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedResults),
      };
    }

    return;
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    };
  }
}
