---
name: Fastify empty JSON body handling
description: Fastify rejects Content-Type: application/json with empty body (FST_ERR_CTP_EMPTY_JSON_BODY). Mobile SDKs trigger this on routes like logout.
---

## Rule

Add a global `addContentTypeParser` for `'application/json'` at the top of `buildApp()` that treats empty body as `{}`:

```ts
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  const str = (body as string).trim();
  if (!str) { done(null, {}); return; }
  try { done(null, JSON.parse(str)); }
  catch (err) { (err as any).statusCode = 400; done(err as Error, undefined); }
});
```

**Why:** Mobile SDKs (Expo, React Native) often set `Content-Type: application/json` on every POST regardless of body. Routes like logout have no body but receive the header, causing Fastify to reject with 400. The fix is server-side because clients cannot always be controlled.

**How to apply:** Register BEFORE plugins and routes. `bodyLimit: 0` does NOT work in Fastify v4 (throws FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT).
