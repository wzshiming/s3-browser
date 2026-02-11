import type { S3Endpoint } from '../types';

const ENDPOINTS_KEY = 's3-browser-endpoints';

// Simple encoding for credentials (not cryptographic security, but obfuscation)
const encode = (str: string): string => {
  return btoa(encodeURIComponent(str));
};

const decode = (str: string): string => {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return str;
  }
};

export const saveEndpoints = (endpoints: S3Endpoint[]): void => {
  const encoded = endpoints.map(ep => ({
    ...ep,
    accessKeyId: encode(ep.accessKeyId),
    secretAccessKey: encode(ep.secretAccessKey),
  }));
  localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(encoded));
};

export const loadEndpoints = (): S3Endpoint[] => {
  const data = localStorage.getItem(ENDPOINTS_KEY);
  if (!data) return [];
  
  try {
    const endpoints = JSON.parse(data);
    return endpoints.map((ep: S3Endpoint) => ({
      ...ep,
      accessKeyId: decode(ep.accessKeyId),
      secretAccessKey: decode(ep.secretAccessKey),
    }));
  } catch {
    return [];
  }
};

export const addEndpoint = (endpoint: S3Endpoint): void => {
  const endpoints = loadEndpoints();
  endpoints.push(endpoint);
  saveEndpoints(endpoints);
};

export const updateEndpoint = (endpoint: S3Endpoint): void => {
  const endpoints = loadEndpoints();
  const index = endpoints.findIndex(ep => ep.name === endpoint.name);
  if (index >= 0) {
    endpoints[index] = endpoint;
    saveEndpoints(endpoints);
  }
};

export const deleteEndpoint = (name: string): void => {
  const endpoints = loadEndpoints().filter(ep => ep.name !== name);
  saveEndpoints(endpoints);
};
