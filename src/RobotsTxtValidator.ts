import { URL } from "url";
import Logger from "./utils/Logger";
import axios from 'axios';

export default class RobotsTxtValidator {
  private robotsTxt?: string;
  private hasAttemptedToFetchRobotsTxt: boolean = false;
  private logger: Logger = new Logger(RobotsTxtValidator.name);

  async isUrlAllowed(url: URL): Promise<boolean> {
    if (!this.hasAttemptedToFetchRobotsTxt) {
      const robotsTxtUrl = `${url.origin}/robots.txt`;
      
      try {
        this.hasAttemptedToFetchRobotsTxt = true;
        const response = await axios.get(robotsTxtUrl);
        this.robotsTxt = response.data;
        this.logger.log(`Found robots.txt from ${robotsTxtUrl}.`);
      } catch (error) {
        this.logger.logWarning(`Could not fetch robots.txt from ${robotsTxtUrl}.`);
      }
    }
    
    if (this.robotsTxt && !this.isAllowedPath(url.pathname)) {
      return false;
    }

    return true;
  }

  private isAllowedPath(pathName: string): boolean {
    for (let pathPart of pathName.split('/').filter(n => n !== '')) {
      if (!this.isAllowed(pathPart)) {
        return false;
      }
    }

    return true;
  }

  private isAllowed(value: string): boolean {
    const expression = new RegExp(`[Dd]isallow: (\\/|\\*\\/|\\/\\*|\\/\\*\\/)${value}(\\$|$|\\/|\\/\\*|\\/\\*\\?)`);
    const matches = this.robotsTxt?.match(expression) || [];

    return matches.length > 0;
  }
}