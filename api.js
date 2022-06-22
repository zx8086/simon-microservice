import { apiVerification } from './util.js'
app.use(async (req, res, next) => {
    // Here, apiVerification is a function that returns true if the right request is sent.
    // We only want to apply it to POST methods, though, so lets add that to our middleware.
    if(req.method == "POST") {
        let verifyCredentials = await apiVerification(req);
        if(verifyCredentials) {
            next();
        }
        else {
            res.status(400).send("ERROR OCCURRED");
        }
    }
    else {
        // For everything else, like "GET", go to next valid route.
        next();
    }
});