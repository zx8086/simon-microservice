// index.ts
import Elysia from "elysia";
import { controller } from "./controller";
import config from './../config';

const app = new Elysia();

if (typeof app === 'undefined') {
    throw new Error('Could not initialize Elysia');
}

// Apply the controller to your app
controller(app); // The app instance is passed to the controller

// Start listening on the configured port
const DEFAULT_PORT = 3000;

let port :number = parseInt(config.elysiaJs.PORT, 10);
if (isNaN(port)) {
    console.warn(`Invalid port number in config. Falling back to default port ${DEFAULT_PORT}`);
    port = DEFAULT_PORT;
}

app.listen(port, () => {
    console.log(`URL Shortener is running on port ${port}`);
});