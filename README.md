# ip-intel

Express middleware to extract the real client IP address (supporting proxies and CDNs) and optionally enrich with geo-location data. Attaches info to `req.clientInfo`.

## Features

- Accurate client IP extraction (supports `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`, etc.)
- Configurable trusted proxies and header priority
- Optional geo-location enrichment (default: ip-api.com)
- Lightweight, privacy-conscious, and configurable

## Usage

Install the package:

```sh
npm install ip-intel
```

Add the middleware to your Express app:

```ts
import express from "express";
import ipIntel from "ip-intel";

const app = express();
// Enable geo-location enrichment (optional)
app.use(ipIntel({ geo: true }));

app.get("/", (req, res) => {
	// req.clientInfo will be available here
	res.json(req.clientInfo);
});

app.listen(3000);
```

### What does this library do?

- Extracts the real client IP address from incoming requests, even when behind proxies or CDNs.
- Optionally enriches the request with geo-location data (country, region, city, latitude, longitude) using a pluggable provider (default: ip-api.com).
- Attaches the result to `req.clientInfo` for use in your routes, logging, analytics, or security logic.

### Example output

#### When running on localhost

If you test this middleware on your local machine (e.g., using `localhost` or `127.0.0.1`), the output will look like this:

```json
{
	"ip": "::1"
}
```

or (if using IPv4):

```json
{
	"ip": "127.0.0.1"
}
```

**Note:** Geo-location data will not be available for local/private IP addresses.

#### When running on a public server

When deployed to a public server or accessed via a public IP (or using a tunneling service like ngrok), the output will include geo-location info:

```json
{
	"ip": "123.45.67.89",
	"geo": {
		"country": "US",
		"region": "California",
		"city": "San Francisco",
		"lat": 37.7749,
		"lon": -122.4194
	}
}
```

If geo-location is disabled or unavailable, the output will be:

```json
{
	"ip": "123.45.67.89"
}
```

## Configuration

- `geo`: Enable geo-location lookup (default: false)
- `geoProvider`: Custom geo provider function (optional)
- `trustedProxies`: Array of trusted proxy IPs or CIDRs
- `headerPriority`: Array of header names to check for IP

## Configuration Examples

You can customize the middleware using these options:

### Enable geo-location (default provider)

```js
app.use(ipIntel({ geo: true }));
```

### Use a custom geo provider

```js
app.use(
	ipIntel({
		geo: true,
		geoProvider: async ip => {
			// Example: always return a fixed location
			return { country: "ID", region: "Bali", city: "Denpasar", lat: -8.65, lon: 115.2167 };
		},
	})
);
```

### Set trusted proxies

```js
app.use(
	ipIntel({
		trustedProxies: ["127.0.0.1", "::1", "10.0.0.0/8"],
	})
);
```

### Customize header priority

```js
app.use(
	ipIntel({
		headerPriority: ["x-real-ip", "x-forwarded-for", "cf-connecting-ip"],
	})
);
```

### Combine options

```js
app.use(
	ipIntel({
		geo: true,
		trustedProxies: ["127.0.0.1"],
		headerPriority: ["x-forwarded-for", "x-real-ip"],
	})
);
```

## License

MIT
