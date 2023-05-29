const dotenv = require("dotenv")
dotenv.config()

var couchbase = require('couchbase')

const InfisicalClient = require("infisical-node")
const envVariable = new InfisicalClient({
    token: process.env.INFISICAL_TOKEN
})

async function connectToCouchbase() {
  try {
    const clusterConnStr = (await envVariable.getSecret("COUCHBASE_CLUSTER_CONN_STR")).secretValue
    const username = (await envVariable.getSecret("COUCHBASE_USERNAME")).secretValue
    const password = (await envVariable.getSecret("COUCHBASE_PASSWORD")).secretValue

    const clusterOptions = {
      username,
      password,
      timeouts: {
        kvTimeout: 10000,
      },
    }

    const cluster = await couchbase.connect(clusterConnStr, clusterOptions)

    return cluster
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error
  }
}

module.exports = { connectToCouchbase }
