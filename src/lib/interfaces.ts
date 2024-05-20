// interfaces.ts
import {Bucket, Cluster, Collection, Scope} from "couchbase";

export interface ClusterConfig {
    cluster: Cluster;
    bucket: Bucket;
    scope: Scope;
    collection: Collection;
}

export interface QuoteResponse {
    _id: string;
    content: string;
    author: string;
    tags: string[];
    authorSlug: string;
    length: number;
    dateAdded: string;
    dateModified: string;
}