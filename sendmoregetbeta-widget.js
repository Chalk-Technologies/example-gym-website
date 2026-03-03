/**
 * SendMoreGetBeta Widget Embed Script
 * Version: 1.0.0
 *
 * Usage: Add data-smgb-widget attributes to any button or link.
 *
 * Required attributes:
 *   data-smgb-gym    : Your gym key (e.g. "8")
 *   data-smgb-widget : Widget type — pass | event | booking | document | voucher | user
 *
 * Optional filter attributes (map to query params):
 *   data-smgb-show-only-events       : Comma-separated event IDs
 *   data-smgb-force-view             : e.g. "calendar"
 *   data-smgb-exclude-templates      : Comma-separated template IDs
 *   data-smgb-show-only-templates    : Comma-separated template IDs
 *   data-smgb-show-only-slots        : Comma-separated slot IDs
 *   data-smgb-exclude-slots          : Comma-separated slot IDs
 *   data-smgb-pmt-type               : Payment type number
 *   data-smgb-video-url              : Video URL string
 *   data-smgb-show-only              : Comma-separated IDs
 *   data-smgb-slots-keys             : Comma-separated slot keys
 *   data-smgb-resource-key           : Resource key number
 *   data-smgb-resource               : Resource number
 *   data-smgb-hide-header            : "true" / "false"
 *   data-smgb-disallow-seek          : "true" / "false"
 *   data-smgb-show-gym-logo          : "true" / "false"
 *   data-smgb-prohibit-auth          : "true" / "false"
 *   data-smgb-no-waiver-prompt       : "true" / "false"
 *   data-smgb-templates              : Comma-separated template IDs
 *
 * Global config (set on the script tag or via window.SMGBConfig):
 *   data-smgb-base-url  : Override the widget base URL (default: https://www.widgets.sendmoregetbeta.com)
 *   data-smgb-gym       : Global gym key fallback (can also be set per button)
 *
 * Example:
 *   <button
 *     data-smgb-widget="pass"
 *     data-smgb-gym="8"
 *     data-smgb-show-only-templates="12,15"
 *   >Buy a Pass</button>
 *
 *   <script src="sendmoregetbeta-widget.js" data-smgb-gym="8"></script>
 */

(function (window, document) {
  "use strict";

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  var DEFAULT_BASE_URL = "https://widgets.sendmoregetbeta.com";

  // Capture script tag reference immediately (synchronous, before DOM finishes parsing).
  // document.currentScript is null for cross-origin scripts served from a CDN/GCS,
  // so fall back to searching by known src pattern or data attributes.
  var SCRIPT_TAG = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (s.getAttribute("data-smgb-gym") || s.getAttribute("data-smgb-base-url")) return s;
      if (s.src && s.src.indexOf("sendmoregetbeta-widget") !== -1) return s;
    }
    return null;
  })();

  // Read BASE_URL and GLOBAL_GYM lazily at call time rather than at parse time.
  // This means window.SMGBConfig can be set anywhere on the page — before or after
  // the script tag — and will always be respected when a widget is opened.
  function getBaseURL() {
    var cfg = window.SMGBConfig || {};
    return (cfg.baseUrl
        || (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-smgb-base-url"))
        || DEFAULT_BASE_URL
    ).replace(/\/$/, "");
  }

  function getGlobalGym() {
    var cfg = window.SMGBConfig || {};
    return cfg.gym
        || (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-smgb-gym"))
        || "";
  }

  /* ─────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────── */
  var CSS = [
    "#smgb-overlay {",
    "  display: none;",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 2147483647;",
    "  background: rgba(0,0,0,0.55);",
    "  backdrop-filter: blur(4px);",
    "  -webkit-backdrop-filter: blur(4px);",
    "  align-items: center;",
    "  justify-content: center;",
    "  padding: 16px;",
    "  box-sizing: border-box;",
    "  animation: smgb-fade-in 0.2s ease;",
    "}",
    "#smgb-overlay.smgb-open { display: flex; }",
    "#smgb-overlay.smgb-closing {",
    "  animation: smgb-fade-out 0.2s ease forwards;",
    "}",
    "#smgb-modal {",
    "  position: relative;",
    "  width: 100%;",
    "  max-width: 960px;",
    "  height: 90vh;",
    "  max-height: 860px;",
    "  background: #fff;",
    "  border-radius: 12px;",
    "  overflow: hidden;",
    "  box-shadow: 0 24px 80px rgba(0,0,0,0.35);",
    "  display: flex;",
    "  flex-direction: column;",
    "  animation: smgb-slide-up 0.25s cubic-bezier(0.34,1.2,0.64,1);",
    "}",
    "#smgb-overlay.smgb-closing #smgb-modal {",
    "  animation: smgb-slide-down 0.2s ease forwards;",
    "}",
    "#smgb-close-btn {",
    "  position: absolute;",
    "  top: 12px;",
    "  right: 12px;",
    "  z-index: 10;",
    "  width: 36px;",
    "  height: 36px;",
    "  border-radius: 50%;",
    "  border: none;",
    "  background: rgba(0,0,0,0.08);",
    "  cursor: pointer;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  transition: background 0.15s;",
    "  padding: 0;",
    "}",
    "#smgb-close-btn:hover { background: rgba(0,0,0,0.18); }",
    "#smgb-close-btn svg { display: block; }",
    "#smgb-iframe-wrap {",
    "  flex: 1;",
    "  position: relative;",
    "}",
    "#smgb-iframe {",
    "  width: 100%;",
    "  height: 100%;",
    "  border: none;",
    "  display: block;",
    "}",
    "#smgb-loader {",
    "  position: absolute;",
    "  inset: 0;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  background: #fff;",
    "  transition: opacity 0.3s;",
    "}",
    "#smgb-loader.smgb-hidden { opacity: 0; pointer-events: none; }",
    ".smgb-spinner {",
    "  width: 40px;",
    "  height: 40px;",
    "  border: 3px solid #eee;",
    "  border-top-color: #333;",
    "  border-radius: 50%;",
    "  animation: smgb-spin 0.7s linear infinite;",
    "}",
    "@keyframes smgb-spin { to { transform: rotate(360deg); } }",
    "@keyframes smgb-fade-in { from { opacity:0; } to { opacity:1; } }",
    "@keyframes smgb-fade-out { from { opacity:1; } to { opacity:0; } }",
    "@keyframes smgb-slide-up {",
    "  from { transform: translateY(32px) scale(0.97); opacity:0; }",
    "  to   { transform: translateY(0)    scale(1);    opacity:1; }",
    "}",
    "@keyframes smgb-slide-down {",
    "  from { transform: translateY(0)    scale(1);    opacity:1; }",
    "  to   { transform: translateY(32px) scale(0.97); opacity:0; }",
    "}",
    "@media (max-width: 600px) {",
    "  #smgb-modal { height: 95vh; max-height: none; border-radius: 8px; }",
    "  #smgb-overlay { padding: 8px; }",
    "}"
  ].join("\n");

  /* ─────────────────────────────────────────────
     DOM CREATION
  ───────────────────────────────────────────── */
  function injectStyles() {
    var style = document.createElement("style");
    style.id = "smgb-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildOverlay() {
    var overlay = document.createElement("div");
    overlay.id = "smgb-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Widget");

    overlay.innerHTML = [
      '<div id="smgb-modal">',
      '  <button id="smgb-close-btn" aria-label="Close widget">',
      '    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '      <path d="M2 2L16 16M16 2L2 16" stroke="#333" stroke-width="2.2" stroke-linecap="round"/>',
      '    </svg>',
      '  </button>',
      '  <div id="smgb-iframe-wrap">',
      '    <div id="smgb-loader"><div class="smgb-spinner"></div></div>',
      '    <iframe id="smgb-iframe" allow="payment; fullscreen" allowfullscreen></iframe>',
      '  </div>',
      '</div>'
    ].join("");

    document.body.appendChild(overlay);
    return overlay;
  }

  /* ─────────────────────────────────────────────
     ANALYTICS HELPERS
  ───────────────────────────────────────────── */

  /** Grab all UTM params + fbclid/gclid/ttclid from current page URL */
  function getTrackingParams() {
    var params = {};
    var trackingKeys = [
      "utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id",
      "fbclid","gclid","ttclid","twclid","li_fat_id","msclkid","dclid","sscid","irclickid"
    ];
    var search = new URLSearchParams(window.location.search);
    trackingKeys.forEach(function (k) {
      if (search.has(k)) params[k] = search.get(k);
    });
    return params;
  }

  /**
   * Collect first-party analytics identifiers from cookies and localStorage.
   * We surface these as query params so the widget iframe (same or cross-origin)
   * can pick them up and attribute conversions correctly.
   *
   * GA4: _ga cookie → client ID
   * Meta Pixel: _fbp (browser fingerprint) + _fbc (click ID, persisted from fbclid)
   */
  function getAnalyticsParams() {
    var params = {};

    // GA4 client ID from _ga cookie  (format: GA1.x.XXXXXXXXXX.XXXXXXXXXX)
    var gaCookie = getCookie("_ga");
    if (gaCookie) {
      var gaParts = gaCookie.split(".");
      if (gaParts.length >= 4) {
        params["_ga"] = gaParts.slice(2).join(".");  // just the numeric client ID portion
      }
    }

    // Also pass the raw _ga cookie value for compatibility
    if (gaCookie) params["_ga_raw"] = gaCookie;

    // Meta _fbp (browser pixel ID) and _fbc (click attribution)
    var fbp = getCookie("_fbp");
    if (fbp) params["_fbp"] = fbp;

    var fbc = getCookie("_fbc");
    if (fbc) params["_fbc"] = fbc;

    // GTM / dataLayer session info — just pass along if present
    var gaSession = getCookie("_ga_session") || getCookie("_gid");
    if (gaSession) params["_gid"] = gaSession;

    return params;
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** Page context forwarded so the widget knows the referrer for attribution */
  function getPageParams() {
    return {
      smgb_ref_url: window.location.href,
      smgb_ref_title: document.title || ""
    };
  }

  /* ─────────────────────────────────────────────
     URL BUILDER
  ───────────────────────────────────────────── */

  var DATA_PARAM_MAP = {
    "show-only-events":     { key: "showOnlyEvents",    type: "array"   },
    "force-view":           { key: "forceView",         type: "string"  },
    "exclude-templates":    { key: "excludeTemplates",  type: "array"   },
    "show-only-templates":  { key: "showOnlyTemplates", type: "array"   },
    "show-only-slots":      { key: "showOnlySlots",     type: "array"   },
    "exclude-slots":        { key: "excludeSlots",      type: "array"   },
    "pmt-type":             { key: "pmtType",           type: "string"  },
    "video-url":            { key: "videoURL",          type: "string"  },
    "show-only":            { key: "showOnly",          type: "array"   },
    "slots-keys":           { key: "slotsKeys",         type: "array"   },
    "resource-key":         { key: "resourceKey",       type: "string"  },
    "resource":             { key: "resource",          type: "string"  },
    "hide-header":          { key: "hideHeader",        type: "boolean" },
    "disallow-seek":        { key: "disallowSeek",      type: "boolean" },
    "show-gym-logo":        { key: "showGymLogo",       type: "boolean" },
    "prohibit-auth":        { key: "prohibitAuth",      type: "boolean" },
    "no-waiver-prompt":     { key: "noWaiverPrompt",    type: "boolean" },
    "templates":            { key: "templates",         type: "array"   }
  };

  function buildWidgetURL(el) {
    var gym = el.getAttribute("data-smgb-gym") || getGlobalGym();
    var widget = el.getAttribute("data-smgb-widget");

    if (!gym || !widget) {
      console.warn("[SMGB] Missing data-smgb-gym or data-smgb-widget on element", el);
      return null;
    }

    var url = getBaseURL() + "/" + encodeURIComponent(gym) + "/" + encodeURIComponent(widget);
    var qs = new URLSearchParams();

    // Widget-specific params from data attributes
    Object.keys(DATA_PARAM_MAP).forEach(function (dataKey) {
      var attrVal = el.getAttribute("data-smgb-" + dataKey);
      if (attrVal === null || attrVal === "") return;

      var def = DATA_PARAM_MAP[dataKey];

      if (def.type === "array") {
        attrVal.split(",").map(function (v) { return v.trim(); }).filter(Boolean).forEach(function (v) {
          qs.append(def.key + "[]", v);
        });
      } else if (def.type === "boolean") {
        if (attrVal === "true" || attrVal === "1") qs.set(def.key, "true");
      } else {
        qs.set(def.key, attrVal);
      }
    });

    // Merge tracking / analytics params
    var tracking = Object.assign({}, getTrackingParams(), getAnalyticsParams(), getPageParams());
    Object.keys(tracking).forEach(function (k) {
      if (tracking[k]) qs.set(k, tracking[k]);
    });

    var qString = qs.toString();
    return qString ? url + "?" + qString : url;
  }

  /* ─────────────────────────────────────────────
     OVERLAY CONTROL
  ───────────────────────────────────────────── */
  var overlay, iframe, loader, closeBtn;
  var previousFocus = null;

  function getOrCreateOverlay() {
    if (!overlay) {
      overlay = document.getElementById("smgb-overlay") || buildOverlay();
      iframe = document.getElementById("smgb-iframe");
      loader = document.getElementById("smgb-loader");
      closeBtn = document.getElementById("smgb-close-btn");

      closeBtn.addEventListener("click", closeOverlay);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeOverlay();
      });
      iframe.addEventListener("load", function () {
        loader.classList.add("smgb-hidden");
      });

      // Communicate analytics cookies INTO the iframe via postMessage once loaded
      iframe.addEventListener("load", function () {
        try {
          var payload = {
            type: "smgb:analytics",
            data: Object.assign({}, getTrackingParams(), getAnalyticsParams(), getPageParams())
          };
          iframe.contentWindow.postMessage(payload, "*");
        } catch (e) { /* cross-origin: silently skip */ }
      });
    }
    return overlay;
  }

  function openOverlay(url) {
    var ov = getOrCreateOverlay();
    previousFocus = document.activeElement;

    loader.classList.remove("smgb-hidden");
    iframe.src = url;

    ov.classList.remove("smgb-closing");
    ov.classList.add("smgb-open");
    document.body.style.overflow = "hidden";

    closeBtn.focus();
    document.addEventListener("keydown", handleKeyDown);

    // Fire a GA4 custom event if gtag is available
    fireAnalyticsEvent("smgb_widget_open", { widget_url: url });
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.add("smgb-closing");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleKeyDown);

    setTimeout(function () {
      overlay.classList.remove("smgb-open", "smgb-closing");
      iframe.src = "about:blank";
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }, 210);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") closeOverlay();

    // Basic focus trap
    if (e.key === "Tab" && overlay) {
      var focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ─────────────────────────────────────────────
     ANALYTICS EVENT HELPERS
  ───────────────────────────────────────────── */
  function fireAnalyticsEvent(eventName, params) {
    // GA4
    if (typeof window.gtag === "function") {
      try { window.gtag("event", eventName, params || {}); } catch (e) {}
    }
    // Meta Pixel
    if (typeof window.fbq === "function") {
      try { window.fbq("trackCustom", eventName, params || {}); } catch (e) {}
    }
    // dataLayer (GTM)
    window.dataLayer = window.dataLayer || [];
    try {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────
     BIND TRIGGERS
  ───────────────────────────────────────────── */
  function bindElement(el) {
    if (el._smgbBound) return;
    el._smgbBound = true;

    // Make non-button/a elements keyboard-accessible
    if (el.tagName !== "BUTTON" && el.tagName !== "A") {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    }

    el.addEventListener("click", function (e) {
      e.preventDefault();
      var url = buildWidgetURL(el);
      if (url) openOverlay(url);
    });

    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var url = buildWidgetURL(el);
        if (url) openOverlay(url);
      }
    });
  }

  function bindAll() {
    var els = document.querySelectorAll("[data-smgb-widget]");
    els.forEach(bindElement);
  }

  /* ─────────────────────────────────────────────
     MUTATION OBSERVER (for dynamic content)
  ───────────────────────────────────────────── */
  function watchDOMChanges() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute && node.hasAttribute("data-smgb-widget")) bindElement(node);
          var children = node.querySelectorAll ? node.querySelectorAll("[data-smgb-widget]") : [];
          children.forEach(bindElement);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ─────────────────────────────────────────────
     PUBLIC API  (window.SMGB)
  ───────────────────────────────────────────── */
  window.SMGB = {
    /**
     * Programmatically open a widget.
     * @param {string} gym        - Gym key
     * @param {string} widgetType - pass | event | booking | document | voucher | user
     * @param {Object} [opts]     - Optional params object matching the query param names
     */
    open: function (gym, widgetType, opts) {
      var syntheticEl = document.createElement("span");
      syntheticEl.setAttribute("data-smgb-gym", gym || getGlobalGym());
      syntheticEl.setAttribute("data-smgb-widget", widgetType);
      if (opts) {
        // Map camelCase option keys back to data- attributes
        var reverseMap = {};
        Object.keys(DATA_PARAM_MAP).forEach(function (k) {
          reverseMap[DATA_PARAM_MAP[k].key] = k;
        });
        Object.keys(opts).forEach(function (k) {
          var dataKey = reverseMap[k] || k;
          var val = Array.isArray(opts[k]) ? opts[k].join(",") : opts[k];
          syntheticEl.setAttribute("data-smgb-" + dataKey, val);
        });
      }
      var url = buildWidgetURL(syntheticEl);
      if (url) openOverlay(url);
    },
    close: closeOverlay,
    version: "1.0.0"
  };

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    injectStyles();
    bindAll();
    watchDOMChanges();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

}(window, document));