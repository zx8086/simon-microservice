const dotenv = require("dotenv");
dotenv.config();

var couchbase = require('couchbase')

async function connectToCouchbase() {

    const clusterConnStr = process.env.COUCHBASE_CLUSTER_CONN_STR
    const username = process.env.COUCHBASE_USERNAME
    const password = process.env.COUCHBASE_PASSWORD

    const cluster = await couchbase.connect(clusterConnStr, {
      username: username,
      password: password,
      timeouts: {
        kvTimeout: 10000, // milliseconds
      },
    })

}

module.exports = { connectToCouchbase }
