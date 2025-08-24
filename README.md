# afetch — fetch() for `<a>` & `<button>` (zero framework)

**afetch** is minimal JavaScript library for adding powerful fetch() capabilities to plain &lt;a> and &lt;button> tags. **afetch** turns plain HTML into real apps: trigger **fetch()** with declarative attributes on `<a>` and `<button>`. No framework. No build step. Works anywhere.

---

## ✨ Why afetch?

- **Zero JS glue** — trigger fetch directly via HTML attributes  
- **Progressive** — works in static sites, CMSes, legacy stacks  
- **File uploads** — `fetch-forms` merges forms + files via `FormData`  
- **Hooks** — lifecycle callbacks (`onresponse`, `onstart`, `onjson`, …)  
- **Smart parsing** — auto-detects JSON/Text/Blob (or force via `fetch-response`)  
- **Tiny** — lightweight, dependency-free

---

## 🚀 10-second demo

```html
<script src="afetch.js"></script>

<a
  fetch="/api/hello"
  fetch-onjson="({data}) => alert(data.time)"
>
  Click Me!
</a>
```
---

## 🛠️ Attributes

| Attribute                   | Default | Example                                    | Description                                                                                              |
| --------------------------- | ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **`fetch`**                 | —       | `/api`                                     | **Required**. The URL to request (relative or absolute).                                                 |
| **`fetch-method`**          | `GET`   | `POST`                                     | HTTP method to use (`GET`, `POST`, `PUT`, `DELETE`, etc.).                                               |
| **`fetch-headers`**         | —       | `{"Content-Type":"application/json"}`      | JSON object of request headers. Must be valid JSON.                                                      |
| **`fetch-body`**            | —       | `{"a":"alpha"}`                            | JSON object of request body. For PHP `$_POST` handling without JSON, use `fetch-body-type="urlencoded"`. |
| **`fetch-body-type`**       | —       | `urlencoded` / `form`                      | Controls how body data is encoded: URL-encoded, JSON, or `FormData`.                                     |
| **`fetch-forms`**           | —       | `formA,formB`                              | One or more form IDs whose fields (including files) will be merged into the request via `FormData`.      |
| **`fetch-response`**        | `auto`  | `json` / `text` / `blob` / `js`            | How to parse the response. Defaults to automatic detection based on `Content-Type`.                      |
| **`fetch-target`**          | —       | `#result`                                  | CSS selector where parsed response will be injected automatically.                                       |
| **`fetch-credentials`**     | —       | `include` / `same-origin` / `omit`         | Controls whether cookies and auth headers are sent.                                                      |
| **`fetch-timeout`**         | `0`     | `5000`                                     | Timeout in milliseconds. `0` = no timeout.                                                               |
| **`fetch-cache`**           | —       | `no-cache` / `reload` / `force-cache`      | Sets the [Cache mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).                   |
| **`fetch-redirect`**        | —       | `follow` / `manual` / `error`              | Sets the [Redirect mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/redirect).             |
| **`fetch-referrer`**        | —       | `https://example.com`                      | Sets the `Referrer` header value.                                                                        |
| **`fetch-referrer-policy`** | —       | `no-referrer` / `origin` / `strict-origin` | Controls [Referrer Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy).   |

---

## 🔄 Hooks

| Hook Name                    | When It Fires                                               | Use Case                                        |
| ---------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| **`fetch-onstart`**          | Before the request is sent                                  | Show loaders or disable UI                      |
| **`fetch-onresponse`**       | When response headers are received                          | Inspect status codes, headers, etc.             |
| **`fetch-onjson`**           | When a JSON response is successfully parsed                 | Handle structured API responses                 |
| **`fetch-ontext`**           | When a text response is successfully parsed                 | Handle plain text or HTML                       |
| **`fetch-onblob`**           | When a blob response is successfully parsed                 | Handle images, PDFs, files                      |
| **`fetch-onjs`**             | When a JS response is received                              | Run `eval()` unless this hook **returns false** |
| **`fetch-onparsingerror`**   | When the response body can't be parsed                      | Invalid JSON, mismatched response types, etc.   |
| **`fetch-onfetchbodyerror`** | When `fetch-body` or `fetch-headers` contains invalid JSON  | Catch and handle attribute parsing errors       |
| **`fetch-onerror`**          | On **any** failure (network, timeout, parsing, HTTP errors) | Display error messages or fallbacks             |
| **`fetch-oncomplete`**       | Always fires at the end                                     | Cleanup, re-enable UI, hide loaders             |
