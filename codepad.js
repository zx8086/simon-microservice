const res = await axios ({
    method: "GET",
    url: "http://
    host: "
    port: "
    path: "
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"

    }
}).then(function (response) {
    logger.info("Call Multiple Micro-Services Correlation...");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end("Call Multiple Micro-Services Correlation...");
    console.log(response);
}
).catch(function (error) {
    logger.error("Failed to call Multiple Micro-Services Correlation...");
    logger.error("Application Error - ", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end("Failed to call Multiple Micro-Services Correlation...");
    console.log(error);
} ).then(function () {
    // always executed
    logger.debug('This is the "/simon" route.');
}
