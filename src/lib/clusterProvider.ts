import { clusterConn, type capellaConn } from './couchbaseConnector';

let connection: capellaConn | null = null;

export const getCluster = async (): Promise<capellaConn> => {
    try {
        if (!connection) {
            connection = await clusterConn();
            console.log('Connection to Couchbase established successfully.');
        }
        return connection;
    } catch (error: any) {
        console.error("Error connecting to Couchbase:", error);
        throw error;
    }
};