import { URL } from "url";

export default class RobotsTxtValidator {
  private robotsTxt: string;
  private userAgent: string;

  constructor(robotsTxt: string, userAgent?: string) {
    this.robotsTxt = robotsTxt;
    this.userAgent = userAgent || '*';
  }

  isUrlAllowed(url: URL): boolean {
    if (!this.isAllowedPath(url.pathname)) {
      return false;
    }

    return true;
  }

  private isAllowedPath(path: string): boolean {
    for (let pathPart of path.split('/').filter(n => n !== '')) {
      if (!this.isAllowed(pathPart)) {
        return false;
      }
    }

    return true;
  }

  private isAllowed(value: string): boolean {
    const userAgentSplit = this.robotsTxt.split('\n');
    let currentUserAgent = '';

    for (var line of userAgentSplit) {
      const agentPattern = /User-agent: (?<Name>.*)/;
      const agentMatch = line.match(agentPattern);
      
      if (agentMatch && agentMatch.length > 1) {
        currentUserAgent = agentMatch[1];
      }

      const concernsThisUser = currentUserAgent === "*" || currentUserAgent === this.userAgent;
      
      if (concernsThisUser) {
        const permissionPattern = new RegExp(`Disallow: [/*]+${value}[/*?]*`);
  
        if ((line.match(permissionPattern)?.length || 0) > 0) {
          return false;
        }
      }
    }

    return true;
  }
}