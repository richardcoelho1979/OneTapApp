---
name: Fastify v4 setErrorHandler scoping and raw response
description: Two non-obvious constraints when customizing error responses in Fastify v4 — plugin scope timing and error serializer bypass.
---

## Rule 1 — setErrorHandler must be registered BEFORE registerRoutes

**Why:** Fastify uses avvio for plugin loading. When you `await app.register(plugin, opts)`, the plugin function executes immediately (avvio async mode). The plugin scope inherits the error handler that is active on the parent *at the time of plugin execution*. If `setErrorHandler` is called after `registerRoutes`, all scoped plugins (routes registered via `app.register()`) have already captured the default error handler and will not pick up the custom one.

**How to apply:** In `buildApp()`, always call `app.setErrorHandler()` and `app.setNotFoundHandler()` before `await registerRoutes(app)`.

Symptom when broken: error handler is never called; `vary: accept-encoding` appears in error responses (compress's onSend still runs via default path); no "Client error" warn log appears despite 4xx errors.

---

## Rule 2 — reply.send() inside setErrorHandler goes through the error serializer

**Why:** Fastify's `preHandlerCallback` sets `kReplyIsError = true` before calling `reply.send(err)`. That `send()` call routes through `onErrorHook → handleError → setErrorHandler`. When *your* setErrorHandler calls `reply.send(anything)`, `kReplyIsError` is still true (or the payload is an Error), so it routes back through `onErrorHook → fallbackErrorHandler`. The fallbackErrorHandler uses Fastify's pre-compiled error serializer which only outputs `{statusCode, code, error, message}` — any extra field (like `correlationId`) is silently dropped, and `message` is injected from the original error's `.message` property.

**How to apply:** Inside `setErrorHandler`, write the response directly to `reply.raw`:

```ts
app.setErrorHandler((error, request, reply) => {
  reply.hijack(); // prevents any subsequent reply.send() from doing anything

  const json = JSON.stringify(body); // build your custom body
  const headers = {
    ...reply.getHeaders(),           // helmet, cors, rate-limit headers already set
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(json),
    'x-correlation-id': request.correlationId || '',
  };
  try { reply.raw.writeHead(statusCode, headers); } catch {}
  reply.raw.end(json, 'utf8');
  // DO NOT return anything — async handler returns a Promise which wrapThenable
  // picks up and calls reply.send(undefined), re-triggering the error path.
});
```

`reply.hijack()` marks the reply as sent (`reply.sent === true`), so any subsequent `reply.send()` from Fastify internals becomes a no-op warning. The `onResponse` hook still fires via the Node.js `finish` event (Fastify attaches a listener to `reply.raw` regardless of hijack).

**Important:** The handler must be a SYNC function (not async). An async handler returns a Promise; Fastify's `wrapThenable` awaits it and calls `reply.send(undefined)`, re-entering the error path even after your `reply.raw.end()` has written the response.
