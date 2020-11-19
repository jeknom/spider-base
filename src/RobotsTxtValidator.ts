import { URL, URLSearchParams } from "url";
import Logger from "./utils/Logger";

type userAgent = {
  name: string,
  paths: accessPath[]
}

type accessPath = {
  isAllowed: boolean,
  path: string
}

export default class RobotsTxtValidator {
  agents: userAgent[] = [];
  logger: Logger = new Logger(RobotsTxtValidator.name);

  isPathAllowed(fullUrl: string): boolean {
    const url = new URL(fullUrl);
    for (let agent of this.agents)
    for (let path of agent.paths) {
      const validQuery = this.isValidQueryParams(url.searchParams, path);
      if (!validQuery) {
        return false;
      }

      const validPath = this.isValidPath(url.pathname, path);
      if (!validPath) {
        return false;
      }
    }

    return true;
  }

  private isValidQueryParams(searchParams: URLSearchParams, robotsTxtPath: accessPath): boolean {
    for (let queryParam of searchParams.entries()) {
      if (!this.isValid(`${queryParam[0]}=`, robotsTxtPath)) {
        return false;
      }
    }
    return true;
  }

  private isValidPath(pathName: string, robotsTxtPath: accessPath): boolean {
    for (let pathPart of pathName.split('/')) {
      if (!this.isValid(pathPart, robotsTxtPath)) {
        return false;
      }
    }

    return true;
  }

  private isValid(urlPath: string, robotsTxtPath: accessPath): boolean {
    const { isAllowed, path } = robotsTxtPath;

    if (!isAllowed) {
      const isNotBlocking = 
        path !== '*' &&  
        urlPath !== `/${path}/` && 
        urlPath !== `${path}*` &&
        urlPath !== `${path}/*` && 
        urlPath !== `${path}*/` && 
        urlPath !== `${path}/*/` &&
        urlPath !== `*${path}` &&
        urlPath !== `*/${path}` && 
        urlPath !== `/*${path}` &&
        urlPath !== `/*/${path}`;
  
      return isNotBlocking;
    }

    return true;
  }
}