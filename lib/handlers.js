const dotenv = require("dotenv");
dotenv.config();

const logger = require("./logger")
const axios = require("axios").default;

exports.home = (req, res, ) => {
    logger.info("Welcome to Simon Microservice")
    res.statusCode = 200
    res.setHeader("Content-Type", "application/json")
    res.end("Welcome to Simon Microservice")
    }

exports.health = (req, res) => {
    logger.info("Application is HEALTHY")
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json")
    res.end("Application is HEALTHY")
  }

exports.trace = async (req, res) => {
 axios({
    method: "GET",
    url: "https://gateway.siobytes.com/owusu/trace",
    })
    .then(function (response) {
        logger.info("Call Multiple Micro-Services Correlation...");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end("Call Multiple Micro-Services Correlation...");
        console.log(response);
    })
    .catch(function (error) {
        logger.error("Failed to call Multiple Micro-Services Correlation...");
        logger.error("Application Error - ", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end("Failed to call Multiple Micro-Services Correlation...");
        console.log(error);
    })
    .then(function () {
        // always executed
        logger.debug('This is the "/external" route.');
    });
}

exports.notFound = (req, res) => {
    logger.info("Not Found")
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json")
    res.end("Not Found")
  }

// Express recognizes the error handler by way of its four
// arguments, so we have to disable ESLint's no-unused-vars rule
/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => {
    logger.info("Server Error")
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json")
    res.end("Server Error")
  }
