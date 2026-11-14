import { LOOPBACK_ADDRESSES } from "./auth.constants";

/**
 * Whether the request came from this same machine (IPv4, IPv6 or IPv4-mapped loopback).
 */
export function isLoopbackAddress(ip: string | undefined): boolean {
  return ip !== undefined && LOOPBACK_ADDRESSES.has(ip);
}
