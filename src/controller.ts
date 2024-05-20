// controller.ts
import {Elysia} from 'elysia';
import {pingCluster} from './lib/clusterOperations';
import {fetchQuoteFromAPI} from "./services";

export const controller = (app: Elysia): void => {
    app.get("/health", async (context): Promise<any> => {
        try{
            const pingResult = await pingCluster();
            const unhealthyServices: string[] = [];
            const services = pingResult.services;
            for (const service in services) {
                const isServiceHealthy: boolean = services[service].every((node: any) => node.state === 0);
                if (!isServiceHealthy) {
                    unhealthyServices.push(service);
                }
            }
            if (unhealthyServices.length === 0) {
                return {
                    status: "Service and Cluster are up and running",
                    clusterPing: pingResult
                };
            } else {
                return {
                    status: `Unhealthy services: ${unhealthyServices.join(', ')}`
                }
            }
        } catch (error : any) {
            return { status: "Error encountered", error: error.message };
        }
    });

    app.get("/quote", async (context): Promise<any> => {
        try {
            return await fetchQuoteFromAPI();
        }
        catch (error : any) {
            console.error('Error fetching quote', error);
            return { status: "Error encountered", error: error.message };
        }
    });

};