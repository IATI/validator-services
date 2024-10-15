import { getSummaryAggregateStats } from "../database/db.js";

export default async function pubGetStatsSummaryAggregate(context, req) {
  const date = req.query.date ? req.query.date : "9999-01-01";
  const { publisher } = req.query;
  const { format } = req.query;

  try {
    let result = null;

    result = await getSummaryAggregateStats(date, publisher);

    const parsedResults = {};

    result.forEach((row) => {
      const publisherName = row.publisher_name;
      if (!Object.keys(parsedResults).includes(publisherName)) {
        parsedResults[publisherName] = {};
      }
      if (!Object.keys(parsedResults[publisherName]).includes("critical")) {
        parsedResults[publisherName].critical = 0;
      }
      if (!Object.keys(parsedResults[publisherName]).includes("error")) {
        parsedResults[publisherName].error = 0;
      }
      if (!Object.keys(parsedResults[publisherName]).includes("warning")) {
        parsedResults[publisherName].warning = 0;
      }
      if (!Object.keys(parsedResults[publisherName]).includes("advisory")) {
        parsedResults[publisherName].advisory = 0;
      }
      parsedResults[publisherName][row.severity] = parseInt(row.count, 10);
    });

    if (format === "csv") {
      const flatParsedResults = [];
      Object.keys(parsedResults).forEach((publisherName) => {
        const summary = parsedResults[publisherName];
        flatParsedResults.push({
          publisher_name: publisherName,
          critical: summary.critical,
          error: summary.error,
          warning: summary.warning,
          advisory: summary.advisory,
        });
      });

      const csvString = [
        ["publisher_name", "critical", "error", "warning", "advisory"],
        ...flatParsedResults.map((item) => [
          item.publisher_name,
          item.critical,
          item.error,
          item.warning,
          item.advisory,
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
