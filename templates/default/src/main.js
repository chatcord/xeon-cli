// This file is mandatory.
// Actual Xeon js will find this file and execute.
// This is an module script directly executes in the browser.

// Import view components.
import App from "./views/app.js";

// Export constant named "routes" . Add all routes with view components here.
export const routes = [
      { path: "/", view: App },
      { path: "/home", view: App }
];
// Export the id of the div you chosen in the "/public/index.html" file.
// The constant name must be "root".
export const root = document.getElementById("root");