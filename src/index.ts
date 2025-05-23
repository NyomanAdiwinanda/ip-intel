import { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";

export interface ClientGeoInfo {
	country?: string;
	region?: string;
	city?: string;
	lat?: number;
	lon?: number;
}

export interface ClientInfo {
	ip: string;
	geo?: ClientGeoInfo;
}

export interface RequestIpTrackerOptions {
	geo?: boolean;
	geoProvider?: (ip: string) => Promise<ClientGeoInfo | undefined>;
	trustedProxies?: string[];
	headerPriority?: string[];
}

declare global {
	namespace Express {
		interface Request {
			clientInfo?: ClientInfo;
		}
	}
}

const DEFAULT_HEADER_PRIORITY = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"];

function isTrustedProxy(ip: string, trustedProxies?: string[]): boolean {
	if (!trustedProxies || trustedProxies.length === 0) return false;
	return trustedProxies.includes(ip);
}

function extractClientIp(req: Request, headerPriority: string[], trustedProxies?: string[]): string {
	for (const header of headerPriority) {
		const value = req.headers[header] as string | string[] | undefined;
		if (value) {
			const ips = Array.isArray(value) ? value : value.split(",");
			for (const ip of ips.map(ip => ip.trim())) {
				if (!isTrustedProxy(ip, trustedProxies)) {
					return ip;
				}
			}
		}
	}
	// fallback
	const remote = req.connection?.remoteAddress || req.socket?.remoteAddress;
	if (remote && !isTrustedProxy(remote, trustedProxies)) {
		return remote;
	}
	return "";
}

async function defaultGeoProvider(ip: string): Promise<ClientGeoInfo | undefined> {
	try {
		// Use fetch only if running in production, skip in test
		if (process.env.NODE_ENV === "test") return undefined;
		const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`);
		const data: any = await res.json();
		if (data.status === "success") {
			return {
				country: data.country,
				region: data.regionName,
				city: data.city,
				lat: data.lat,
				lon: data.lon,
			};
		}
	} catch {}
	return undefined;
}

function ipIntel(options: RequestIpTrackerOptions = {}) {
	const {
		geo = false,
		geoProvider = defaultGeoProvider,
		trustedProxies = [],
		headerPriority = DEFAULT_HEADER_PRIORITY,
	} = options;

	return async function (req: Request, res: Response, next: NextFunction) {
		const ip = extractClientIp(req, headerPriority, trustedProxies);
		const clientInfo: ClientInfo = { ip };
		if (geo && ip) {
			clientInfo.geo = await geoProvider(ip);
		}
		req.clientInfo = clientInfo;
		next();
	};
}

module.exports = ipIntel;
// For ESM default import compatibility
module.exports.default = ipIntel;
