import fetch from "node-fetch";
import config from "../config/config.js";
import { insertAdhocValidation } from "../database/db.js";
import { checkRespStatus } from "../utils/utils.js";

function endWithBadResponse(
  context,
  body = { message: "Bad Request" },
  status = 400,
) {
  context.log.error(body.message);
  context.bindings.response = {
    headers: { "Content-Type": "application/json" },
    status,
    body,
  };
}

// eslint-disable-next-line consistent-return
export default async function pvtPostAdhocUrl(context, req) {
  try {
    if (!req.query.url) {
      return endWithBadResponse(context, { message: `No filename apparent` });
    }

    if (!req.query.sessionId) {
      return endWithBadResponse(context, { message: `No sessionId apparent` });
    }

    if (!req.query.guid) {
      return endWithBadResponse(context, `No guid apparent`);
    }

    let result;
    try {
      result = await fetch(req.query.url, {
        headers: { "User-Agent": `iati-validator-upload/${config.VERSION}` },
      });
    } catch (err) {
      const message = `Error fetching from provided URL: ${err.message}`;
      return endWithBadResponse(
        context,
        { message, url: req.query.url, code: err.code },
        422,
      );
    }

    try {
      checkRespStatus(result);
    } catch (err) {
      const message = `Error fetching from provided URL: ${err.message}`;
      const errorBody = await err.response.text();
      return endWithBadResponse(
        context,
        { message, errorBody, url: req.query.url },
        422,
      );
    }

    context.bindings.storage = await result.text();

    await insertAdhocValidation(
      req.query.sessionId,
      req.query.url,
      req.query.guid,
    );
  } catch (err) {
    context.log.error(err.message);
    throw err;
  }
}
