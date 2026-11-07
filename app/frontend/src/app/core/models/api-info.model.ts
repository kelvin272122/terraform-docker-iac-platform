export interface ApiInfo {
  readonly environment: 'dev' | 'prod';
  readonly apiVersion: string;
  readonly appVersion: string;
  readonly instanceId: string;
}
