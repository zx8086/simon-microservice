import type {PingResult} from 'couchbase';
import { getCluster } from './clusterProvider';
import type {
    ClusterConfig,
} from './interfaces';

export async function pingCluster(): Promise<PingResult> {
    const { cluster }: ClusterConfig = await getCluster();
    try {
        const result: PingResult  = await cluster.ping();
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (error: any) {
        console.error("Error pinging the cluster:", error);
        throw error;
    }
}