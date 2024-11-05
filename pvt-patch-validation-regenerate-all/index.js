import { updateRegenerateValidationForAll } from "../database/db.js";

export default async function pvtPatchValidationRegenerateAll(context) {
  try {
    await updateRegenerateValidationForAll();

    context.res = {
      status: 204,
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
