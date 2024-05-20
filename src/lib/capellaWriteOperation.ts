import { getCluster } from "./clusterProvider";
import type { Scope, Collection } from "couchbase";

export async function saveDataToCapella(id: string, data: any) {
    // Get connection
    const connection = await getCluster();

    // Specify your scope and collection
    const scope :Scope = connection.bucket.scope('quotes');
    const collection :Collection = scope.collection('general');

    // Store the document in Couchbase
    try {
        await collection.upsert(id, data);
        console.log(`Saved document with id: ${id}`);
    } catch (error) {
        console.error(`Couldn't save document to Couchbase: ${error}`);
    }
}