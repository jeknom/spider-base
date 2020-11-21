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
    const userAgentsPattern = /User-agent: (?<UserAgent>.*)(?<Permissions>[a-zA-z: /*?.$=\-\n]+)(?!User-agent)/gm;
    const matches = this.robotsTxt?.matchAll(userAgentsPattern) || [];
    
    for (let match of matches) {
      const matchAgent = match.groups?.UserAgent || '';
      
      if (matchAgent === '*' || matchAgent === this.userAgent) {
        const matchPermissions = match.groups?.Permissions || '';
        const permissionsPattern = new RegExp(`[Dd]isallow: [/*]+${value}[/*$]*`);
        const disallowedMatches = matchPermissions.match(permissionsPattern);

        if (disallowedMatches && disallowedMatches.length > 0) {
          return false;
        }
      }
    }

    return true;
  }
}