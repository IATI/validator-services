import { updateRegenerateValidationForAll } from "../database/db.js";
import {
  isInMaintenanceMode,
  maintenanceModes,
  setMaintenanceModeResponse,
} from "../utils/maintenance-mode.js";

export default async function pvtPatchValidationRegenerateAll(context) {
  try {
    if (isInMaintenanceMode(maintenanceModes.NO_WRITE)) {
      setMaintenanceModeResponse(context);
      return;
    }

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
