const dotenv = require("dotenv")
dotenv.config()

const couchbase = require('couchbase')
const { connectToCouchbase } = require('./couchbaseConnection')

const logger = require("./logger")
const axios = require("axios").default

const InfisicalClient = require("infisical-node")

const envVariable = new InfisicalClient({
    token: process.env.INFISICAL_TOKEN
})

function logAndWriteToLogger(message) {
  console.log(message)  
  logger.info(message) 
}

exports.home = async(request, h) => {

  const SERVICE_NAME = (await envVariable.getSecret("SERVICE_NAME")).secretValue
  logger.info(`Welcome to ${SERVICE_NAME}`)

  return h.response(`Welcome to ${SERVICE_NAME}`)
    .type('application/json')
    .code(200)
    .header('X-Custom', 'some-value')
}

exports.hello = function (request, h) {

  const name = request.params.name
  return 'Hello ' + name
}

exports.health = async (request, h) => {
  try {
    const cluster = await connectToCouchbase()

    const result = await cluster.ping({
      serviceTypes: [
        couchbase.ServiceType.KeyValue,
        couchbase.ServiceType.Query,
        couchbase.ServiceType.Management,
        couchbase.ServiceType.Search,
        couchbase.ServiceType.Analytics,
        couchbase.ServiceType.Eventing,
      ],
    })

    // console.log("\nResult:")
    // console.dir(result, { depth: null })

    return h.response(result).code(200)
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
  }
}

exports.createScopes = async (request, h) => {
  try {

    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    var result = await bucket.ping()
    console.dir(result, { depth: null })

    const collectionMgr = bucket.collections()
  
    try {
      await collectionMgr.createScope('customers')
    } catch (e) {
      if (e instanceof couchbase.ScopeExistsError) {
        console.log('The scope already exists')
      } else {
        throw e
      }
    }

    return h.response(`Scope created successfully`)
    .type('application/json')
    .code(200)

  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
  }
}

exports.createCollections = async (request, h) => {
  try {

    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    // var result = await bucket.ping()
    // console.dir(result, { depth: null })

    const collectionMgr = bucket.collections()

    try {
      var collectionSpec = new couchbase.CollectionSpec({
        name: 'accounts',
        scopeName: 'customers',
      })
    
      await collectionMgr.createCollection(collectionSpec)
    } catch (e) {
      if (e instanceof couchbase.CollectionExistsError) {
        console.log('The collection already exists')
      } else if (e instanceof couchbase.ScopeNotFoundError) {
        console.log('The scope does not exist')
      } else {
        throw e
      }
    }
  
    try {
      var collectionSpec = new couchbase.CollectionSpec({
        name: 'details',
        scopeName: 'customers',
      })
    
      await collectionMgr.createCollection(collectionSpec)
    } catch (e) {
      if (e instanceof couchbase.CollectionExistsError) {
        console.log('The collection already exists')
      } else if (e instanceof couchbase.ScopeNotFoundError) {
        console.log('The scope does not exist')
      } else {
        throw e
      }
    }
  
    try {
      var collectionSpec = new couchbase.CollectionSpec({
        name: 'assignments',
        scopeName: 'customers',
      })
    
      await collectionMgr.createCollection(collectionSpec)
    } catch (e) {
      if (e instanceof couchbase.CollectionExistsError) {
        console.log('The collection already exists')
      } else if (e instanceof couchbase.ScopeNotFoundError) {
        console.log('The scope does not exist')
      } else {
        throw e
      }
    }

    return h.response(`Collections created successfully`)
    .type('application/json')
    .code(200)

  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
  }
}

exports.createIndexes = async (request, h) => {
  try {

    const bucketName = (await envVariable.getSecret("COUCHBASE_BUCKET_NAME")).secretValue
    const cluster = await connectToCouchbase()
    const bucket = cluster.bucket(bucketName)

    // var result = await bucket.ping()
    // console.dir(result, { depth: null })

    const collectionMgr = bucket.collections()
  
    const queryIndexMgr = cluster.queryIndexes()

    try {
      await queryIndexMgr.createPrimaryIndex('default', {
        scopeName: 'customers',
        collectionName: 'accounts',
        ignoreIfExists: true,
      })
      logAndWriteToLogger('Primary index created for accounts collection')
    } catch (error) {
      console.error('Error creating primary index for accounts collection:', error)
    }
    
    try {
      await queryIndexMgr.createPrimaryIndex('default', {
        scopeName: 'customers',
        collectionName: 'details',
        ignoreIfExists: true,
      })
      logAndWriteToLogger('Primary index created for details collection')
    } catch (error) {
      console.error('Error creating primary index for details collection:', error)
    }
    
    try {
      await queryIndexMgr.createPrimaryIndex('default', {
        scopeName: 'customers',
        collectionName: 'assignments',
        ignoreIfExists: true,
      })
      logAndWriteToLogger('Primary index created for assignments collection')
    } catch (error) {
      console.error('Error creating primary index for assignments collection:', error)
    }
    
    return h.response(`Indexes created successfully`)
    .type('application/json')
    .code(200)

  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
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
      console.log('Upsert Result:', result)
    } catch (e) {
      if (e instanceof couchbase.DocumentExistsError) {
        console.log("Document unexpectedly exists")
      }
    }

    return h.response(`Document upserted successfully`)
      .type('application/json')
      .code(200)
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error; // Rethrow the error to be handled at a higher level
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
      console.log('Get Result:', getAccountDoc)

      return h.response(getAccountDoc.content).code(200).type('application/json')
    } catch (e) {
      if (e instanceof couchbase.DocumentNotFoundError) {
        console.log("The document is missing")
      }
    }

    return h.response("Document not found").code(404)
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
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
      console.log('Delete Result:', deleteResult)

      if (deleteResult.cas) {
        return h.response(`Document ${documentId} deleted`).code(200)
      } else {
        return h.response(`Failed to delete document ${documentId}`).code(500)
      }
    } catch (e) {
      if (e instanceof couchbase.DocumentNotFoundError) {
        console.log("The document is missing")
        return h.response("Document not found").code(404)
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Failed to connect to Couchbase:', error)
    throw error // Rethrow the error to be handled at a higher level
  }
}

exports.traces = async (request, h) => {
  try {
    const response = await fetch("https://gateway.siobytes.com/owusu/trace")
    const data = await response.json()

    logger.info("Call Multiple Micro-Services Correlation...")
    return h.response("Call Multiple Micro-Services Correlation...").code(200)
  } catch (error) {
    logger.error("Failed to call Multiple Micro-Services Correlation...")
    logger.error("Application Error - ", error)
    return h.response("Failed to call Multiple Micro-Services Correlation...")
      .code(500)
  }
}

exports.badRequest = async function (request, h) {

  throw Boom.badRequest('Unsupported parameter')  // 400
}

exports.notFound =  async function (request, h) {
  
  return h.response('404 Error! Page Not Found!').code(404) // 404

}

exports.serverError = async function (request, h) {

  throw new Error('unexpect error') // 500
}
