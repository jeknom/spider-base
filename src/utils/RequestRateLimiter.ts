import axios, { AxiosResponse } from "axios";
import { URL } from "url";
import { waitUntilTrue, waitForMilliseconds } from "./PromiseUtils";
import Logger from './Logger';

export default class RequestRateLimiter {
  private maxConcurrentRequests: number = 1;
  private requestIntervalInMilliseconds: number = 1000;
  private requestTimeoutInMilliseconds: number = 1000;
  private currentRequestsCount: number = 0;
  private logger: Logger = new Logger(RequestRateLimiter.name);

  constructor(
    maxConcurrentRequests: number,
    requestIntervalInMilliseconds: number,
    requestTimeoutInMilliseconds: number) {
    
    if (maxConcurrentRequests > 0) {
      this.maxConcurrentRequests = maxConcurrentRequests;
    } else {
      this.logger.logError(`Max concurrent requests needs to be higher than zero, was ${maxConcurrentRequests}!`);
    }

    if (requestIntervalInMilliseconds > 0) {
      this.requestIntervalInMilliseconds = requestIntervalInMilliseconds;
    } else {
      this.logger.logError(
        `Interval in milliseconds needs to be higher than zero, was ${requestIntervalInMilliseconds}!`);
    }

    if (requestTimeoutInMilliseconds > 0) {
      this.requestTimeoutInMilliseconds = requestTimeoutInMilliseconds;
    } else {
      this.logger.logError(
        `Timeout in milliseconds needs to be higher than zero, was ${requestTimeoutInMilliseconds}!`);
    }
  }

  async handleRequest(url: URL): Promise<(AxiosResponse | null)> {
    await waitUntilTrue(() => this.currentRequestsCount < this.maxConcurrentRequests);

    this.logger.log("Sending a request.");

    const response = await this.handleRequestInternal(url);

    return response;
  }

  async handleRequests(urls: URL[]): Promise<(AxiosResponse | null)[]> {
    const ongoingRequests: Promise<AxiosResponse | null>[] = [];

    for (var i = 0; i < urls.length; i++) {
      const isMaxRequestsExceeded = this.maxConcurrentRequests < 0 &&
        this.currentRequestsCount >= this.maxConcurrentRequests
      
      if (isMaxRequestsExceeded) {
        await waitUntilTrue(() => this.currentRequestsCount < this.maxConcurrentRequests);
      }

      if (this.requestIntervalInMilliseconds > 0) {
        await waitForMilliseconds(this.requestIntervalInMilliseconds);
      }

      ongoingRequests.push(this.handleRequestInternal(urls[i]));
      
      this.logger.log(`Sending request ${ongoingRequests.length} / ${urls.length}.`);
    }

    const results = await Promise.all(ongoingRequests);
    
    return results;
  }

  private async handleRequestInternal(url: URL): Promise<AxiosResponse | null> {
    let response: AxiosResponse | null = null;
    
    try {
        this.currentRequestsCount++;
        response = await axios.get(url.href, { timeout: this.requestTimeoutInMilliseconds });
    } catch (error) {
      this.logger.logError(error);
    }

    this.currentRequestsCount--;

    return response;
  }
}
