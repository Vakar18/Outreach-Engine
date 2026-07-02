export const CONNECTION_CHANGED_EVENT = "outreach:connection-changed";

export function notifyConnectionChanged() {
  window.dispatchEvent(new Event(CONNECTION_CHANGED_EVENT));
}