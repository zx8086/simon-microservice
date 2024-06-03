// index.ts
import Elysia from "elysia";
import { controller } from "./controller";
import config from './../config';

// Create an instance of Elysia
const app = new Elysia();

// Apply the controller to your app
controller(app); // The app instance is passed to the controller

// Parse and set the port to listen on from the configuration
// @ts-ignore
const port = parseInt(config.elysiaJs.PORT, 10);

// Start listening on the configured port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});