//app/src/services.ts
import type { QuoteResponse } from './lib/interfaces';
import {saveDataToCapella} from "./lib/capellaWriteOperation";

const QUOTABLE_API_URL: string = "https://api.quotable.io/random";
const REQUEST_HEADERS = {
    method: "GET",
    headers: { "Content-Type": "application/json" }
};

export async function fetchQuoteFromAPI(): Promise<QuoteResponse> {
    const response :any = await fetch(QUOTABLE_API_URL, REQUEST_HEADERS);
    console.log(response);
    const data : QuoteResponse = await response.json();

    // Use the '_id' field of the received data as the docId
    const docId :string = data._id;

    // Store the data to Couchbase
    await saveDataToCapella(docId, data);

    return data;
}