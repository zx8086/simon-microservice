const dotenv = require("dotenv")
dotenv.config()

const couchbase = require('couchbase')
const { connectToCouchbase } = require('./couchbaseConnection')

const logger = require("./logger")

const InfisicalClient = require("infisical-node")
const { custom } = require("joi")

const envVariable = new InfisicalClient({
    token: process.env.INFISICAL_TOKEN
})

function logAndWriteToLogger(message) {
  console.log(message)  
  logger.info(message) 
}

exports.home = async(request, h) => {

  const SERVICE_NAME = (await envVariable.getSecret("SERVICE_NAME")).secretValue
  logAndWriteToLogger(`Welcome to ${SERVICE_NAME}`)

  return h.response(`Welcome to ${SERVICE_NAME}`)
    .code(200).type('application/json').header('X-Couchbase', 'Capella')
}

exports.health = async (request, h) => {
  try {
    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    // const bucket = cluster.bucket(bucketName)

    const result = await cluster.ping()

    // const diagResult = await bucket.diagnostics()
    // console.log(diagResult)

    if (result && result.status && result.status[couchbase.PingStatus.OK]) {
      logAndWriteToLogger('Couchbase cluster is healthy')
    } else {
      logAndWriteToLogger('Couchbase cluster health check failed')
    }

    console.dir(result, { depth: null })

    return h.response(result).code(200).type('application/json').header('X-Couchbase', 'Capella')
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    logAndWriteToLogger(`Failed to connect to Couchbase: ${error.message}`)

    if (error instanceof couchbase.AuthenticationFailureError) {
      logAndWriteToLogger('Authentication failure occurred')
    } else {
      throw error // Rethrow the error to be handled at a higher level
    }
  }
}

exports.createScopes = async (request, h) => {
  try {
    const scopeName = request.params.scope;
    logAndWriteToLogger(`Creating scope '${scopeName}'`)

    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)
    const collectionMgr = bucket.collections()

    try {
      await collectionMgr.createScope(scopeName)
      logAndWriteToLogger(`Scope '${scopeName}' created successfully`)

      return h.response({
        message: `Scope '${scopeName}' created successfully`,
      }).code(200).type('application/json').header('X-Couchbase', 'Capella')
    } catch (e) {
      if (e instanceof couchbase.ScopeExistsError) {
        logAndWriteToLogger(`The scope '${scopeName}' already exists`)

        return h.response({
          message: `The scope '${scopeName}' already exists`,
        }).code(409).type('application/json').header('X-Couchbase', 'Capella')
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    logAndWriteToLogger(`Failed to connect to Couchbase: ${error.message}`)

    return h.response({
      message: 'Failed to connect to Couchbase',
      error: error.message,
    }).code(500).type('application/json').header('X-Couchbase', 'Capella')
  }
}

exports.createCollections = async (request, h) => {
  try {
    const scopeName = request.params.scope
    const collectionName = request.params.collection

    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)
    const collectionMgr = bucket.collections()

    try {
      const collectionSpec = new couchbase.CollectionSpec({
        name: collectionName,
        scopeName: scopeName,
      });

      await collectionMgr.createCollection(collectionSpec);
      logAndWriteToLogger(`Collection '${collectionName}' created successfully in scope '${scopeName}'`)

      return h.response({
        message: `Collection '${collectionName}' created successfully in scope '${scopeName}'`,
      }).code(200).type('application/json').header('X-Couchbase', 'Capella')
    } catch (e) {
      if (e instanceof couchbase.CollectionExistsError) {
        logAndWriteToLogger('The collection already exists')
        return h.response({
          message: 'The collection already exists',
        }).code(409).type('application/json').header('X-Couchbase', 'Capella')
      } else if (e instanceof couchbase.ScopeNotFoundError) {
        logAndWriteToLogger('The scope does not exist')
        return h.response({
          message: 'The scope does not exist',
        }).code(404).type('application/json').header('X-Couchbase', 'Capella')
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    logAndWriteToLogger(`Failed to connect to Couchbase: ${error.message}`)

    return h.response({
      message: 'Failed to connect to Couchbase',
      error: error.message,
    }).code(500)
  }
}

exports.createIndexes = async (request, h) => {
  try {
    const { scopeName, collectionName } = request.params
    const indexName = request.query.indexName
    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)
    const collectionMgr = bucket.collections()
    const queryIndexMgr = cluster.queryIndexes()

    try {
      // Check if the scope exists
      const scopeExists = await collectionMgr.scopeExists(scopeName)
      if (!scopeExists) {
        logAndWriteToLogger(`Scope '${scopeName}' does not exist`)
        return h.response({ message: `Scope '${scopeName}' does not exist` }).code(404).type('application/json').header('X-Couchbase', 'Capella')
      }

      // Check if the collection exists within the scope
      const collectionExists = await collectionMgr.collectionExists(scopeName, collectionName)
      if (!collectionExists) {
        logAndWriteToLogger(`Collection '${collectionName}' does not exist in scope '${scopeName}'`)
        return h.response({ message: `Collection '${collectionName}' does not exist in scope '${scopeName}'` }).code(404).type('application/json').header('X-Couchbase', 'Capella')
      }

      await queryIndexMgr.createPrimaryIndex(bucketName, {
        scopeName,
        collectionName,
        indexName,
        ignoreIfExists: true,
      })

      logAndWriteToLogger(`Primary index '${indexName}' created for '${collectionName}' collection in scope '${scopeName}'`)

      return h.response({ message: 'Index created successfully' }).code(200).type('application/json').header('X-Couchbase', 'Capella')
    } catch (error) {
      console.error(`Error creating primary index for '${collectionName}' collection in scope '${scopeName}':`, error)
      return h.response({ message: 'Failed to create index', error: error.message }).code(500).type('application/json').header('X-Couchbase', 'Capella')
    }
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    logAndWriteToLogger(`Failed to connect to Couchbase: ${error.message}`)

    return h.response({
      message: 'Failed to connect to Couchbase',
      error: error.message,
    }).code(500)
  }
}

exports.createAccountDoc = async (request, h) => {
  try {
    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    const collection = bucket.scope('customers').collection('accounts')

    const account = {
      displayName: 'Simon Owusu',
      domain: null,
      email: 'Simon.Owusu@Tommy.com',
      email_canonical: 'simon.owusu@tommy.com',
      enabled: true,
      isActive: true,
      is_showroom_user: true,
      assignments: [
        {
          "accountNumber": "0000036408",
          "buyerNumber": "0000028437",
          "companyCode": "INLC",
          "currencyCode": "EUR",
          "customerNumber": "0000028437",
          "divisionCode": "05",
          "groupCode": null,
          "id": "ACCOUNT_INLC_0000028437_05_INLC_0000036408_0000028437_0000028437",
          "indexInGroup": 0,
          "isActive": true,
          "name": "BASECO S.A DE CVV",
          "payerNumber": "0000028437",
          "salesOrganizationCode": "INLC"
        },
        {
          "accountNumber": "0000036408",
          "buyerNumber": "0000028437",
          "companyCode": "INLC",
          "currencyCode": "EUR",
          "customerNumber": "0000028437",
          "divisionCode": "07",
          "groupCode": null,
          "id": "ACCOUNT_INLC_0000028437_07_INLC_0000036408_0000028437_0000028437",
          "indexInGroup": 0,
          "isActive": true,
          "name": "BASECO S.A DE CVV",
          "payerNumber": "0000028437",
          "salesOrganizationCode": "INLC"
        }
      ],
      linkedUsers: ["ACCOUNT_PVHCORP_CLINDE"],
      last_login: '2022-12-15T18:42:33+01:00',
      password: '$2y$13$lk9x73grakg448g48ow0wO2shGkIva7dKrQ.SCK58g16mjo4Gg/1y',
      salt: 'lk9x73grakg448g48ow0wckg04woggs',
      showroom_username: 'sowusu',
      showroom_username_canonical: 'sowusu',
      userName: 'PVHCORP\\SOWUSU',
    }

    try {
      const options = {
        expiry: 60,
        persist_to: 1,
        replicate_to: 1,
        durabilityLevel: couchbase.DurabilityLevel.None,
        timeout: 5000
      }

      const result = await collection.upsert('ACCOUNT_PVHCORP_SOWUSU', account, options)
      logAndWriteToLogger('Upsert Result:', result)
    } catch (e) {
      if (e instanceof couchbase.DocumentExistsError) {
        logAndWriteToLogger("Document unexpectedly exists")
      }
    }

    return h.response(`Document upserted successfully`)
      .code(200).type('application/json').header('X-Couchbase', 'Capella')
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error
  }
}

exports.getAccountDoc = async (request, h) => {
  try {
    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue;
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    try {
      const collection = bucket.scope('customers').collection('accounts')

      const getAccountDoc = await collection.get('ACCOUNT_PVHCORP_SOWUSU')
      logAndWriteToLogger('Get Result:', getAccountDoc)

      return h.response(getAccountDoc.content).code(200).type('application/json')
    } catch (e) {
      if (e instanceof couchbase.DocumentNotFoundError) {
        logAndWriteToLogger("The document is missing")
      }
    }

    return h.response("Document not found").code(404)
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error
  }
}

exports.deleteAccountDoc = async (request, h) => {
  try {
    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    try {
      const collection = bucket.scope('customers').collection('accounts')

      const documentId = 'ACCOUNT_PVHCORP_SOWUSU'
      const deleteResult = await collection.remove(documentId)
      logAndWriteToLogger('Delete Result:', deleteResult)

      if (deleteResult.cas) {
        return h.response(`Document ${documentId} deleted`).code(200).type('application/json').header('X-Couchbase', 'Capella')
      } else {
        return h.response(`Failed to delete document ${documentId}`).code(500).type('application/json').header('X-Couchbase', 'Capella')
      }
    } catch (e) {
      if (e instanceof couchbase.DocumentNotFoundError) {
        logAndWriteToLogger("The document is missing")
        return h.response("Document not found").code(404).type('application/json').header('X-Couchbase', 'Capella')
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error
  }
}

exports.traces = async (request, h) => {
  try {
    const response = await fetch("https://gateway.siobytes.com/owusu/trace")
    const data = await response.json()

    logger.info("Call Multiple Micro-Services Correlation...")
    return h.response("Call Multiple Micro-Services Correlation...")
      .code(200).type('application/json').header('X-Couchbase', 'Capella')
  } catch (error) {
    logger.error("Failed to call Multiple Micro-Services Correlation...")
    logger.error("Application Error - ", error)
    return h.response("Failed to call Multiple Micro-Services Correlation...")
      .code(500).type('application/json').header('X-Couchbase', 'Capella')
  }
}

exports.badRequest = async function (request, h) {

  throw Boom.badRequest('Unsupported parameter')  // 400
}

exports.notFound =  async function (request, h) {
  
  return h.response('404 Error! Page Not Found!').code(404).type('application/json').header('X-Couchbase', 'Capella')

}

exports.serverError = async function (request, h) {

  throw new Error('unexpect error') // 500
}
