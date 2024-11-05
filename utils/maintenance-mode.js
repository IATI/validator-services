/**
 * @readonly
 * @enum {number}
 */
export const maintenanceModes = {
  DISABLED: 0,
  NO_WRITE: 1,
  NO_READ: 2,
};

const modeInEnv =
  process.env.MAINTENANCE_MODE !== undefined
    ? process.env.MAINTENANCE_MODE.toUpperCase()
    : "DISABLED";

const appMode =
  modeInEnv in maintenanceModes
    ? maintenanceModes[modeInEnv]
    : maintenanceModes.DISABLED;

/**
 * @param {maintenanceModes} [mode]
 */
export function isInMaintenanceMode(mode) {
  return appMode >= mode;
}

/**
 * @returns {string}
 */
export function getMaintenanceModeMessage() {
  return process.env.MAINTENANCE_MODE_MESSAGE !== undefined
    ? process.env.MAINTENANCE_MODE_MESSAGE
    : "";
}

/**
 * @param {string} [message]
 */
export function setMaintenanceModeResponse(context, message) {
  const maintenanceModeMessage =
    message === undefined ? getMaintenanceModeMessage() : message;
  const httpOutputBinding = context.bindingDefinitions.filter(
    (binding) => binding.direction === "out" && binding.type === "http",
  );
  if (httpOutputBinding.length !== 1) {
    throw new Error(
      "maintenance-mode: cannot find HTTP output binding to return error message on",
    );
  }
  context.bindings[httpOutputBinding[0].name] = {
    status: 503,
    body: {
      message: maintenanceModeMessage,
    },
  };
}
