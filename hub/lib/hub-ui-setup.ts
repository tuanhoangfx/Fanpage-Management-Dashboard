import { configureFilterIcons, configureHubChromePrefs } from "@tool-workspace/hub-ui";

export function setupHubUi() {
  configureFilterIcons({});
  configureHubChromePrefs(() => ({ headerPin: true, searchPin: true }));
}
