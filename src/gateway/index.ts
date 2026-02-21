export { GatewayClient } from './client';
export { GatewayError } from './errors';
export { generateUUID, buildGatewayUrl } from './utils';
export {
  startDiscovery,
  scanGateways,
  type DiscoveredGateway,
} from './discovery';
export {
  calculateDelay,
  DEFAULT_RECONNECT_CONFIG,
  type ReconnectConfig,
} from './reconnect';
