// controller.ts
import { Elysia } from 'elysia';
import { pingCluster } from './lib/clusterOperations'; // Import the function

export const controller = (app: Elysia) : void => {
    app.get("/health", async (context) : Promise<any> => {
        const pingResult = await pingCluster(); // Ping the cluster
        const unhealthyServices: string[] = [];
        const services = pingResult.services;

        // Create a list of unhealthy services
        for (const service in services) {
            const isServiceHealthy = services[service].every((node: any) => node.state === 0);
            if (!isServiceHealthy) {
                unhealthyServices.push(service);
            }
        }

        if (unhealthyServices.length === 0) { // All services are healthy
            return {
                status: "Service and Cluster are up and running",
                clusterPing: pingResult
            };
        } else {
            return {
                status: `Unhealthy services: ${unhealthyServices.join(', ')}`
            }
        }
    });
};