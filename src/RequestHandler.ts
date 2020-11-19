import axios, { AxiosResponse } from "axios";
import { waitUntilTrue, waitForMilliseconds } from "./utils/PromiseUtils";
import { requestConfig } from "../types";
import Logger from './utils/Logger';

export default class RequestHandler {
  private maxConcurrentRequests: number = 1;
  private requestIntervalInMilliseconds: number = 1000;
  private currentRequestsCount: number = 0;
  private logger: Logger = new Logger(RequestHandler.name);

  constructor(maxConcurrentRequests: number, requestIntervalInMilliseconds: number) {
    const isValidMaxConcurrentRequestsValue = maxConcurrentRequests > 0;
    const isValidIntervalInMillisecondsValue = requestIntervalInMilliseconds > 0;
    
    if (isValidMaxConcurrentRequestsValue) {
      this.maxConcurrentRequests = maxConcurrentRequests;
    } else {
      this.logger.logError(`Max concurrent requests needs to be higher than zero, was ${maxConcurrentRequests}!`);
    }

    if (isValidIntervalInMillisecondsValue) {
      this.requestIntervalInMilliseconds = requestIntervalInMilliseconds;
    } else {
      this.logger.logError(
        `Interval in milliseconds needs to be higher than zero, was ${requestIntervalInMilliseconds}!`);
    }
  }

  async handleRequests(requestConfigs: requestConfig[]): Promise<(AxiosResponse | null)[]> {
    const ongoingRequests: Promise<AxiosResponse | null>[] = [];

    for (var i = 0; i < requestConfigs.length; i++) {
      const isMaxRequestsExceeded = this.maxConcurrentRequests < 0 &&
        this.currentRequestsCount >= this.maxConcurrentRequests
      
      if (isMaxRequestsExceeded) {
        await waitUntilTrue(() => this.currentRequestsCount < this.maxConcurrentRequests);
      }

      if (this.requestIntervalInMilliseconds > 0) {
        await waitForMilliseconds(this.requestIntervalInMilliseconds);
      }

      ongoingRequests.push(this.handleRequestInternal(requestConfigs[i]));
      
      this.logger.log(`Sending request ${ongoingRequests.length} / ${requestConfigs.length}.`);
    }

    const results = await Promise.all(ongoingRequests);
    
    return results;
  }

  private async handleRequestInternal(requestConfig: requestConfig): Promise<AxiosResponse | null> {
    let response: AxiosResponse | null = null;
    
    try {
      if (requestConfig.url) {
        this.currentRequestsCount++;
        response = await axios.get(requestConfig.url, requestConfig.axiosConfig);
      } else {
        throw ("Could not send request. The request config baseUrl was missing");
      }
    } catch (error) {
      this.logger.logError(error);
    }

    this.currentRequestsCount--;

    return response;
  }
}
