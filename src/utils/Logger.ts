import moment from 'moment';

export default class Logger {
  private source: string;
  private LOGGER_DATE_FORMAT: string = 'h:mm:ss a';
  private getFormattedCurrentTime = () => moment().format(this.LOGGER_DATE_FORMAT);
  private buildLogPrefix = () => `${this.getFormattedCurrentTime()} | ${this.source} |`;

  constructor(source: string) {
    this.source = source;
  }
  
  log(...messages: string[]) {
    console.log(this.buildLogPrefix(), messages.join(' '));
  }

  logWarning(...messages: string[]) {
    console.warn(this.buildLogPrefix(), messages.join(' '));
  }

  logError(...messages: string[]) {
    console.error(this.buildLogPrefix(), messages.join(' '));
  }
}