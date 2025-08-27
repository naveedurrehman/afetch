/*!
 * afetch.js v1.0.0
 * A lightweight JS library for fetch via <a> and <button> tags
 * (c) 2025 Naveed - MIT License
 * https://github.com/naveedurrehman/afetch
 */

(function (global) {
    const lower = s => (s || "").toLowerCase();
    const strictJSON = (s) => (s ? JSON.parse(s) : null);
    const resolveFn = (name) => (name ? name.split(".").reduce((o, k) => (o ? o[k] : undefined), globalThis) : null);

    const callHook = (el, attr, detail) => {
        const code = el.getAttribute(attr);
        if (!code) return;

        let fn;
        try {
            fn = resolveFn(code);
            fn = new Function('detail', `"use strict"; return ((${code}))(detail);`);
        } catch (e) {
            console.error(`Invalid inline handler in ${attr}: ${code}`, e);
            return;
        }

        if (typeof fn === "function") {
            try { return fn(detail); }
            catch (e) { console.error(`Error running ${attr}`, e); }
        }
    };

    function appendJsonToFormData(fd, obj, prefix) {
        if (obj === null || obj === undefined) return;
        if (obj instanceof File || obj instanceof Blob) { fd.append(prefix || 'file', obj); return; }
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                obj.forEach((v, i) => appendJsonToFormData(fd, v, prefix ? `${prefix}[${i}]` : String(i)));
            } else {
                Object.entries(obj).forEach(([k, v]) => appendJsonToFormData(fd, v, prefix ? `${prefix}[${k}]` : k));
            }
            return;
        }
        if (prefix) fd.append(prefix, String(obj));
    }

    const buildFormDataFromForms = (formIds) => {
        const fd = new FormData();
        formIds.forEach(id => {
            const form = document.getElementById(id);
            if (!form) { console.warn(`fetch-forms: form not found: ${id}`); return; }
            const ffd = new FormData(form);
            for (const [k, v] of ffd.entries()) fd.append(k, v);
        });
        return fd;
    };

    const parseByType = async (res, prefer) => {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const want = lower(prefer || "auto");
        if (want === "json") return { kind: "json", data: await res.json() };
        if (want === "text") return { kind: "text", data: await res.text() };
        if (want === "blob") return { kind: "blob", data: await res.blob() };
        if (ct.includes("application/json")) return { kind: "json", data: await res.json() };
        if (ct.includes("application/javascript") || ct.includes("text/javascript")) return { kind: "js", data: await res.text() };
        if (ct.startsWith("text/") || ct.includes("charset=")) return { kind: "text", data: await res.text() };
        return { kind: "blob", data: await res.blob() };
    };

    const buildBodyHeaders = (el, method) => {
        const formsAttr = el.getAttribute("fetch-forms");
        if (formsAttr) {
            const formIds = formsAttr.split(/\s*,\s*/).filter(Boolean);
            const fd = buildFormDataFromForms(formIds);
            if (el.hasAttribute("fetch-body")) {
                try {
                    const toMerge = strictJSON(el.getAttribute("fetch-body"));
                    if (toMerge) appendJsonToFormData(fd, toMerge);
                } catch (e) {
                    console.error("fetch-body merge failed:", e);
                    callHook(el, "fetch-onerror", { element: el, error: e });
                }
            }
            const headers = new Headers();
            if (["get", "head"].includes(lower(method))) {
                console.warn("fetch-forms with GET/HEAD — switching to POST");
                return { headers, body: fd, queryObj: null, methodOverride: "POST" };
            }
            return { headers, body: fd, queryObj: null };
        }

        const headers = new Headers();
        const headersAttr = el.getAttribute("fetch-headers");
        if (headersAttr) {
            const h = strictJSON(headersAttr);
            if (h && typeof h === "object") for (const [k, v] of Object.entries(h)) headers.set(k, v);
        }

        const hasBody = el.hasAttribute("fetch-body");
        const bodyObj = hasBody ? strictJSON(el.getAttribute("fetch-body")) : null;

        if (["get", "head"].includes(lower(method))) {
            return { headers, body: undefined, queryObj: bodyObj };
        }

        if (bodyObj && typeof bodyObj === "object") {
            const ct = (headers.get("Content-Type") || "").toLowerCase();
            if (ct === "application/x-www-form-urlencoded") {
                const params = new URLSearchParams();
                for (const [k, v] of Object.entries(bodyObj)) params.append(k, String(v));
                return { headers, body: params.toString(), queryObj: null };
            }
            if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
            return { headers, body: JSON.stringify(bodyObj), queryObj: null };
        }

        return { headers, body: undefined, queryObj: null };
    };

    async function handleClick(e) {
        const a = e.target.closest("a[fetch], button[fetch]");
        if (!a) return;
        e.preventDefault();

        if (a.hasAttribute('fetch-onbefore')) {
            callHook(a, "fetch-onbefore", a);
        }

        const urlAttr = a.getAttribute("fetch");
        if (!urlAttr) return;

        let method = a.getAttribute("fetch-method") || "GET";
        const mode = a.getAttribute("fetch-mode") || undefined;
        const credentials = a.getAttribute("fetch-credentials") || undefined;
        const cache = a.getAttribute("fetch-cache") || undefined;
        const redirect = a.getAttribute("fetch-redirect") || undefined;
        const referrer = a.getAttribute("fetch-referrer") || undefined;
        const refPol = a.getAttribute("fetch-referrer-policy") || undefined;
        const responseAs = a.getAttribute("fetch-response") || "auto";
        const targetSel = a.getAttribute("fetch-target") || null;
        const targetformat = a.getAttribute("fetch-target-format") || 'html';
        const targetmode = a.getAttribute("fetch-target-mode") || 0;
        const timeoutMs = parseInt(a.getAttribute("fetch-timeout") || "0", 10) || 0;
        const execjs = getBooleanAttr(a, "fetch-execjs", true);

        let url = new URL(urlAttr, location.href);
        let body, headers, queryObj, methodOverride;
        try {
            ({ body, headers, queryObj, methodOverride } = buildBodyHeaders(a, method));
            if (methodOverride) method = methodOverride;
        } catch (err) {
            console.error(['fetch-onfetchbodyerror', err]);
            callHook(a, "fetch-onfetchbodyerror", { element: a, error: err });
            callHook(a, "fetch-onerror", { element: a, error: err });
            if (targetSel) {
                const t = document.querySelector(targetSel);
                if (t) renderToTarget(t, `Invalid fetch-body: ${err.message}`, targetformat, targetmode)
            }
            return;
        }

        if (queryObj) {
            Object.entries(queryObj).forEach(([k, v]) => url.searchParams.set(k, String(v)));
        }

        const controller = new AbortController();
        const timeoutId = timeoutMs ? setTimeout(() => {
            controller.abort('Timeout!');
            console.error(['fetch-ontimeout']);
            callHook(a, "fetch-ontimeout", { element: a, url: url.href, method, timeout: timeoutMs });
        }, timeoutMs) : null;

        activateSpinner(a, true);
        activateDisabling(a, true);
        callHook(a, "fetch-onstart", { element: a, url: url.href, method, init: { headers: headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers, body } });

        const wasDisabled = a.hasAttribute("aria-disabled");
        a.setAttribute("aria-disabled", "true");

        try {
            const res = await fetch(url, {
                method, headers, body,
                mode, credentials, cache, redirect,
                referrer, referrerPolicy: refPol,
                signal: controller.signal
            });

            callHook(a, "fetch-onresponse", { element: a, url: url.href, method, response: res });

            // Handle parse errors on NOT OK responses
            if (!res.ok) {
                const errParsed = await parseByType(res, responseAs);
                console.error(["fetch-onfailure", errParsed]);
                callHook(a, "fetch-onfailure", { element: a, url: url.href, method, error: errParsed });
                callHook(a, "fetch-onerror", { element: a, error: errParsed });
                if (targetSel) {
                    const t = document.querySelector(targetSel);
                    if (t) {
                        renderToTarget(t, errParsed.kind === "json" ? JSON.stringify(errParsed.data, null, 2) : ((errParsed.kind === "text" || errParsed.kind === "js") ? errParsed.data : "[blob received]")
                            , targetformat, targetmode)
                    }
                }
                return;
            }

            // Handle parse errors even on OK responses
            const resClone = res.clone();
            let parsed;
            try {
                parsed = await parseByType(res, responseAs);
            } catch (parseErr) {
                let raw = "";
                try { raw = await resClone.text(); } catch { }
                console.error(['fetch-onparsingerror', parseErr]);
                callHook(a, "fetch-onparsingerror", { element: a, url: url.href, method, error: parseErr, raw, response: res });
                callHook(a, "fetch-onerror", { element: a, error: parseErr });
                if (targetSel) {
                    const t = document.querySelector(targetSel);
                    if (t) renderToTarget(t, raw || String(parseErr), targetformat, targetmode);
                }
                return;
            }


            if (parsed.kind === "json") callHook(a, "fetch-onjson", { element: a, url: url.href, method, data: parsed.data, response: res });
            if (parsed.kind === "text") callHook(a, "fetch-ontext", { element: a, url: url.href, method, data: parsed.data, response: res });
            if (parsed.kind === "blob") callHook(a, "fetch-onblob", { element: a, url: url.href, method, data: parsed.data, response: res });
            if (parsed.kind === "js") { callHook(a, "fetch-onjs", { element: a, url: url.href, method, data: parsed.data, response: res }); if (execjs === true) { eval(parsed.data); } }

            if (targetSel) {
                const t = document.querySelector(targetSel);
                if (t) {
                    renderToTarget(t, parsed.kind === "json" ? JSON.stringify(parsed.data, null, 2) : ((parsed.kind === "text" || parsed.kind === "js") ? parsed.data : "[blob received]")
                        , targetformat, targetmode);
                }
            }
        } catch (error) {
            console.error(["fetch-onfailure", error]);
            callHook(a, "fetch-onfailure", { element: a, url: url.href, method, error: error });
            callHook(a, "fetch-onerror", { element: a, error: error });
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (!wasDisabled) a.removeAttribute("aria-disabled");
            activateSpinner(a, false);
            activateDisabling(a, false);
            callHook(a, "fetch-oncomplete", { element: a, url: url.href, method });
        }
    }


    function getBooleanAttr(el, name, defaultValue = false) {
        if (!el.hasAttribute(name)) return defaultValue;        // not present
        const raw = el.getAttribute(name);
        if (raw == null || raw === "") return true;             // present, no value
        const s = String(raw).trim().toLowerCase();
        if (["true", "1", "yes", "y", "on"].includes(s)) return true;
        if (["false", "0", "no", "n", "off"].includes(s)) return false;
        return defaultValue;                                    // unknown token
    }

    function renderToTarget(el, content, format = "html", mode = "reset") {
        if (!el) return el;

        // Normalize format
        const isHtml = String(format).toLowerCase() === "html";

        // Normalize mode
        const m = (() => {
            if (mode == null || mode === 0 || String(mode).toLowerCase() === "reset") return 0;
            if (mode === 1 || String(mode).toLowerCase() === "append") return 1;
            if (mode === -1 || String(mode).toLowerCase() === "prepend") return -1;
            return 0; // default fallback
        })();

        const s = content == null ? "" : String(content);

        if (m === 0) {
            // reset/replace content
            if (isHtml) el.innerHTML = s;
            else el.textContent = s;
        } else if (m === 1) {
            // append
            if (isHtml) el.insertAdjacentHTML("beforeend", s);
            else el.insertAdjacentText("beforeend", s);
        } else {
            // prepend (m === -1)
            if (isHtml) el.insertAdjacentHTML("afterbegin", s);
            else el.insertAdjacentText("afterbegin", s);
        }

        return el;
    }

    function activateSpinner(element, displayStatus) {
        if (element.hasAttribute('fetch-spinner')) {
            document.querySelectorAll(element.getAttribute('fetch-spinner')).forEach(el => {
                if (displayStatus == true) { el.style.display = ''; }
                else { el.style.display = 'none'; }
            });
        }
    }

    function activateDisabling(element, disableStatus) {
        if (element.hasAttribute('fetch-disabling')) {
            element.disabled = disableStatus;
        }
    }

    function upgradeAnchors(root = document) {
        const anchors = root.querySelectorAll('a[fetch]:not([data-afetch]), button[fetch]:not([data-afetch])');
        anchors.forEach(a => {
            a.setAttribute('data-afetch', '');
            if (a.localName === 'a') {
                if (!a.hasAttribute('role')) a.setAttribute('role', 'button');
                if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '0');
                if (!a.hasAttribute('href')) a.setAttribute('href', '#');
            }
            if (a.hasAttribute('fetch-spinner')) {
                activateSpinner(a, false);
            }

        });
    }

    function init() {
        if (!global.__afetch_click_bound) {
            document.addEventListener('click', handleClick);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const a = e.target.closest('a[fetch], button[fetch]');
                    if (a) { e.preventDefault(); a.click(); }
                }
            });
            global.__afetch_click_bound = true;
        }
        upgradeAnchors(document);

        if (!global.__afetch_observer && !global.AFetch?.disableAutoObserve) {
            const obs = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'childList') {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (node.matches?.('a[fetch], button[fetch]')) upgradeAnchors(node.parentNode || document);
                                else upgradeAnchors(node);
                            }
                        });
                    }
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            global.__afetch_observer = obs;
        }
    }

    global.AFetch = Object.assign(global.AFetch || {}, {
        init,
        refresh: () => upgradeAnchors(document),
        disableAutoObserve: false,
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);