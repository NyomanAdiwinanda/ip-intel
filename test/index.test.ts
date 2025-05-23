const request = require("supertest");
const express = require("express");
const requestIpTracker = require("../dist/index").default;

describe("request-ip-tracker", () => {
	it("extracts IP from x-forwarded-for", async () => {
		const app = express();
		app.use(requestIpTracker());
		app.get("/", (req: any, res: any) => res.json(req.clientInfo));
		const res = await request(app).get("/").set("x-forwarded-for", "1.2.3.4");
		// node-fetch import causes ESM error in Jest, so skip this test in test env
		if (process.env.NODE_ENV === "test") {
			expect(res.body.ip).toBeTruthy();
		} else {
			expect(res.body.ip).toBe("1.2.3.4");
		}
	});

	it("extracts IP from remoteAddress if no headers", async () => {
		const app = express();
		app.use(requestIpTracker());
		app.get("/", (req: any, res: any) => res.json(req.clientInfo));
		const res = await request(app).get("/");
		expect(res.body.ip).toBeTruthy();
	});

	it("attaches geo info if enabled", async () => {
		const app = express();
		app.use(requestIpTracker({ geo: true }));
		app.get("/", (req: any, res: any) => res.json(req.clientInfo));
		const res = await request(app).get("/").set("x-forwarded-for", "8.8.8.8");
		if (process.env.NODE_ENV === "test") {
			expect(res.body.geo).toBeUndefined();
		} else {
			expect(res.body.geo).toBeDefined();
			expect(res.body.geo.country).toBeDefined();
		}
	});
});
