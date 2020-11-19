import axios, { AxiosResponse } from "axios";
import { waitUntilTrue, waitForMilliseconds } from "./utils/PromiseUtils";
import { requestConfig } from "../types";
import Logger from './utils/Logger';

export default class RequestHandler {
  private maxConcurrentRequests: number;
  private requestIntervalInMilliseconds: number;
  private currentRequestsCount: number = 0;
  private logger: Logger = new Logger(RequestHandler.name);

  constructor(maxConcurrentRequests: number = 1, requestIntervalInMilliseconds: number = 10000) {
    const isInvalidValue = (value: number) => value && value != -1 && value < 0;
    const isInvalidMaxConcurrentRequestsValue = isInvalidValue(maxConcurrentRequests);
    const isInvalidIntervalInMillisecondsValue = isInvalidValue(requestIntervalInMilliseconds);
    
    if (isInvalidMaxConcurrentRequestsValue) {
      this.logger.logError(
        `Invalid max concurrent request value ${maxConcurrentRequests}. Expected value bigger or equal to -1!`);
    }

    if (isInvalidIntervalInMillisecondsValue) {
      this.logger.logError(
        `Invalid interval in seconds value ${requestIntervalInMilliseconds}. Expected value bigger or equal to -1!`);
    }

    this.maxConcurrentRequests = maxConcurrentRequests || -1;
    this.requestIntervalInMilliseconds = requestIntervalInMilliseconds || -1;
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
