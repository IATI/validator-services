import fetch from "node-fetch";
import config from "../config/config.js";
import { updateAdhocValidation } from "../database/db.js";
import {
  getMaintenanceModeMessage,
  isInMaintenanceMode,
  maintenanceModes,
} from "../utils/maintenance-mode.js";

export default async function blobTriggerAdhocFile(context) {
  let errorStatus = null;
  let result = null;
  let valid = null;
  let report = null;

  try {
    if (isInMaintenanceMode(maintenanceModes.NO_WRITE)) {
      console.log(
        `validator-services is in maintenance mode so can't process blob trigger: ${getMaintenanceModeMessage()}`,
      );
      throw new Error(
        `validator-services is in maintenance mode so can't process blob trigger: ${getMaintenanceModeMessage()}`,
      );
    }

    console.log("Blob Trigger: Making Validator request");

    result = await fetch(config.VALIDATOR_API_URL, {
      headers: {
        "Content-Type": "application/json",
        "x-functions-key": config.VALIDATOR_FUNC_KEY,
      },
      body: context.bindings.myBlob.toString(),
      method: "post",
    });
  } catch (err) {
    if (!err.response.status) {
      context.log.error(err.message);
      throw err;
    }

    errorStatus = err.response.status;

    if (errorStatus >= 500 || errorStatus === 404) {
      context.log.error(err.message);
      throw err;
    }

    result = err.response;
  }

  try {
    const ids = context.bindingData.name.split("###");
    const sessionId = ids[0];
    const guid = ids[2];

    report = await result.json();

    if (Object.prototype.hasOwnProperty.call(report, "summary")) {
      if (report.summary.critical > 0) {
        valid = false;
      } else {
        valid = true;
      }
    } else {
      report = null;
    }

    const { created } = context.bindingData.properties;

    console.log("Blob Trigger: Making DB update");

    await updateAdhocValidation(
      guid,
      sessionId,
      valid,
      report,
      created,
      errorStatus,
    );
  } catch (err) {
    context.log.error(err.message);
    throw err;
  }
}
