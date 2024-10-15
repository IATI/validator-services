import { getPublishersWithDocuments } from "../database/db.js";

export default async function pvtGetPublishers(context) {
  try {
    const result = await getPublishersWithDocuments();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };

    return;
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    };
  }
}
