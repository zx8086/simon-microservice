import {getCluster} from "./clusterProvider";

export async function saveDataToCapella(id: string, data: any) {
    // Get connection
    const connection = await getCluster();

    // Specify your scope and collection
    const scope = connection.bucket.scope('quotes');
    const collection = scope.collection('general');

    // Store the document in Couchbase
    try {
        await collection.upsert(id, data);
        console.log(`Saved document with id: ${id}`);
    } catch (error) {
        console.error(`Couldn't save document to Couchbase: ${error}`);
    }
}