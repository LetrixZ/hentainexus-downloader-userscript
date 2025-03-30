// ==UserScript==
// @name         hentainexus-downloader-userscript
// @namespace    vite-plugin-monkey
// @version      1.3.0
// @author       monkey
// @description  Allows users to download a gallery from HentaiNexus with it's metadata
// @match        https://hentainexus.com/*
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.14.3/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.14.3/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @grant        GM_addStyle
// ==/UserScript==

(e=>{if(typeof GM_addStyle=="function"){GM_addStyle(e);return}const t=document.createElement("style");t.textContent=e,document.head.append(t)})(" .disabled{pointer-events:none}.animate-spin{animation:spin 1s linear infinite}.download-header{margin:0;background:0}.grey path{fill:#bdcbdb}.has-background-primary .grey path{fill:#fff}.download-icon{height:100%;padding:.75rem;border:none;background:none!important;outline:none}.progress-text{font-size:.75rem;font-weight:600}.flex{display:flex}.mb-6{margin-bottom:1.5rem}.ms-auto{margin-inline-start:auto}.space-between{justify-content:space-between}.items-center{align-items:center}.downloaded path{fill:#5cb85c}.has-background-primary .downloaded path{fill:#7be57b}.failed path{fill:#ec5b56!important}.has-background-primary .failed path{fill:#6b1717!important}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}} ");


System.register("./__entry.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      const scriptRel = function detectScriptRel() {
        const relList = typeof document !== "undefined" && document.createElement("link").relList;
        return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
      }();
      const assetsURL = function(dep) {
        return "/" + dep;
      };
      const seen = {};
      const __vitePreload = function preload(baseModule, deps, importerUrl) {
        let promise = Promise.resolve();
        if (deps && deps.length > 0) {
          const links = document.getElementsByTagName("link");
          promise = Promise.all(deps.map((dep) => {
            dep = assetsURL(dep);
            if (dep in seen)
              return;
            seen[dep] = true;
            const isCss = dep.endsWith(".css");
            const cssSelector = isCss ? '[rel="stylesheet"]' : "";
            const isBaseRelative = !!importerUrl;
            if (isBaseRelative) {
              for (let i = links.length - 1; i >= 0; i--) {
                const link2 = links[i];
                if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
                  return;
                }
              }
            } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
              return;
            }
            const link = document.createElement("link");
            link.rel = isCss ? "stylesheet" : scriptRel;
            if (!isCss) {
              link.as = "script";
              link.crossOrigin = "";
            }
            link.href = dep;
            document.head.appendChild(link);
            if (isCss) {
              return new Promise((res, rej) => {
                link.addEventListener("load", res);
                link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
              });
            }
          }));
        }
        return promise.then(() => baseModule()).catch((err) => {
          const e = new Event("vite:preloadError", { cancelable: true });
          e.payload = err;
          window.dispatchEvent(e);
          if (!e.defaultPrevented) {
            throw err;
          }
        });
      };
      if (location.pathname == "/" || location.pathname.startsWith("/page") || location.pathname.startsWith("/favorites")) {
        __vitePreload(() => module.import('./library-1aCGqxsM-Gxu7OAAU.js'), void 0 ).then((m) => m.init());
      } else if (location.pathname.startsWith("/view/")) {
        __vitePreload(() => module.import('./gallery-r0I-5xdW-yajH0XzI.js'), void 0 ).then((m) => m.init());
      } else if (location.pathname.startsWith("/settings")) {
        __vitePreload(() => module.import('./settings-_03oqxPd-XE-OHLWG.js'), void 0 ).then((m) => m.init());
      }

    })
  };
}));

System.register("./library-1aCGqxsM-Gxu7OAAU.js", ['./utils-V7dpPPxq-UFoiAUZL.js'], (function (exports, module) {
  'use strict';
  var downloaded, downloadIcon, createLibraryItemDownloadStateManager, getMetadata, getImages, startDownload, sleep, createDownloadStateStore;
  return {
    setters: [module => {
      downloaded = module.d;
      downloadIcon = module.a;
      createLibraryItemDownloadStateManager = module.c;
      getMetadata = module.g;
      getImages = module.b;
      startDownload = module.s;
      sleep = module.e;
      createDownloadStateStore = module.f;
    }],
    execute: (function () {

      const downloadState = createDownloadStateStore();
      const libraryItemElements = Array.from(document.querySelectorAll(".column"));
      const libraryItemState = createLibraryItemDownloadStateManager(libraryItemElements);
      const createHeaderButton = () => {
        const button = document.createElement("button");
        button.innerHTML = "Download all";
        button.classList.add("button", "pagination-next", "download-header");
        downloadState.subscribe((state) => {
          switch (state.kind) {
            case "idle":
              button.innerHTML = "Download all";
              button.classList.remove("disabled");
              break;
            case "processing":
              button.innerHTML = `(${state.progress}/${state.total}) Downloading`;
              button.classList.add("disabled");
              break;
            case "success":
              button.innerHTML = `(${state.progress}/${state.total}) Download finished`;
              button.classList.add("disabled");
              break;
          }
        });
        return button;
      };
      const downloadItem = async (item) => {
        const metadata = await getMetadata(item.id);
        const images = await getImages(item.id);
        libraryItemState.progress(item, 0, images.length);
        await startDownload(
          metadata,
          images,
          (progress) => libraryItemState.progress(item, progress, images.length)
        );
      };
      const handleLibraryDownload = async () => {
        let libraryItems = libraryItemElements.map((element) => ({
          id: Number(element.querySelector("a").getAttribute("href").split("/").at(-1)),
          title: element.querySelector(".card-header").getAttribute("title")
        }));
        if (localStorage.getItem("skip_download") === "true") {
          libraryItems = libraryItems.filter((item) => !downloaded.includes(item.id));
        }
        let progress = 0;
        for (const item of libraryItems) {
          downloadState.processing(progress, libraryItems.length);
          libraryItemState.start(item);
          await downloadItem(item).then(() => {
            progress++;
            downloadState.processing(progress, libraryItems.length);
            libraryItemState.finish(item);
            downloaded.add(item.id);
          }).catch((e) => {
            libraryItemState.fail(item, e);
          });
        }
        downloadState.success(progress, libraryItems.length);
        await sleep(2500);
        downloadState.idle();
      };
      const addHeaderButton = () => {
        const searchTitle = document.querySelector(".search-title");
        const button = createHeaderButton();
        button.addEventListener("click", handleLibraryDownload);
        if (searchTitle) {
          const header = searchTitle.parentElement;
          header.classList.add("flex", "space-between");
          header.append(button);
        } else {
          button.classList.add("ms-auto");
          const container = document.createElement("div");
          container.classList.add("container", "flex", "mb-6");
          container.append(button);
          const section = document.querySelector("section.section:not(.is-hidden)");
          section.prepend(container);
        }
      };
      const addItemsButton = () => {
        for (const element of libraryItemElements) {
          const id = Number(element.querySelector("a").getAttribute("href").split("/").at(-1));
          const title = element.querySelector(".card-header").getAttribute("title");
          const button = document.createElement("button");
          button.id = `download-${id}`;
          button.role = "download";
          button.title = `Download '${title}'`;
          button.innerHTML = downloadIcon;
          button.classList.add("button", "grey", "download-icon");
          if (downloaded.includes(id)) {
            button.classList.add("downloaded");
          }
          button.addEventListener("click", (event) => {
            event.preventDefault();
            const item = { id, title };
            libraryItemState.start(item);
            downloadItem(item).then(() => {
              libraryItemState.finish(item);
              downloaded.add(id);
            }).catch((err) => {
              libraryItemState.fail(item, err);
            });
          });
          const progressText = document.createElement("span");
          progressText.classList.add("progress-text");
          progressText.setAttribute("download", id.toString());
          const header = element.querySelector(".card-header");
          header.classList.add("flex", "items-center");
          header.appendChild(progressText);
          header.appendChild(button);
        }
      };
      const init = exports("init", () => {
        addHeaderButton();
        addItemsButton();
        downloaded.subscribe((galleries) => {
          libraryItemElements.forEach((element) => {
            const button = element.querySelector('button[role="download"');
            const state = button.getAttribute("state");
            if (state !== "idle") {
              return;
            }
            const id = Number(button.getAttribute("id").replace("download-", ""));
            if (galleries.includes(id)) {
              button.classList.add("downloaded");
            } else {
              button.classList.remove("downloaded");
            }
          });
        });
      });

    })
  };
}));

System.register("./gallery-r0I-5xdW-yajH0XzI.js", ['./utils-V7dpPPxq-UFoiAUZL.js'], (function (exports, module) {
  'use strict';
  var getData, downloadIcon, downloaded, sleep, xMarkIcon, spinnerIcon, createDownloadStateStore, getImages, startDownload;
  return {
    setters: [module => {
      getData = module.h;
      downloadIcon = module.a;
      downloaded = module.d;
      sleep = module.e;
      xMarkIcon = module.x;
      spinnerIcon = module.i;
      createDownloadStateStore = module.f;
      getImages = module.b;
      startDownload = module.s;
    }],
    execute: (function () {

      const downloadState = createDownloadStateStore();
      const metadata = getData(document);
      const handleDownload = async (event) => {
        event.preventDefault();
        try {
          downloadState.starting();
          const images = await getImages(metadata.id);
          downloadState.processing(0, images.length);
          let currentProgress = 0;
          await startDownload(metadata, images, (progress) => {
            currentProgress = progress;
            downloadState.processing(progress, images.length);
          });
          downloadState.success(currentProgress, images.length);
        } catch (e) {
          downloadState.fail();
          console.error("Failed to download gallery", e);
        }
      };
      function addButton() {
        const readButton = document.querySelector(".level-left > .level-item");
        const button = readButton.cloneNode(true);
        button.querySelector("a").removeAttribute("href");
        button.querySelector(".icon").innerHTML = downloadIcon;
        button.querySelector(".button-label").innerHTML = "Download";
        button.addEventListener("click", handleDownload);
        readButton.after(button);
        downloadState.subscribe(async (state) => {
          switch (state.kind) {
            case "idle":
              button.classList.remove("disabled");
              button.querySelector(".icon").innerHTML = downloadIcon;
              button.querySelector(".button-label").innerHTML = "Download";
              break;
            case "starting":
              button.classList.add("disabled");
              button.querySelector(".icon").innerHTML = spinnerIcon;
              button.querySelector(".button-label").innerHTML = "Downloading";
              break;
            case "processing":
              button.classList.add("disabled");
              button.querySelector(".button-label").innerHTML = `Downloading (${state.progress}/${state.total})`;
              break;
            case "failed":
              button.classList.remove("disabled");
              button.querySelector(".icon").innerHTML = xMarkIcon;
              button.querySelector(".button-label").innerHTML = "Download Failed";
              break;
            case "success":
              button.querySelector(".icon").innerHTML = downloadIcon;
              button.classList.add("disabled");
              button.querySelector(".button-label").innerHTML = `Downloaded (${state.progress}/${state.total})`;
              downloaded.add(metadata.id);
              await sleep(1500);
              downloadState.idle();
              break;
          }
        });
      }
      const init = exports("init", () => {
        addButton();
      });

    })
  };
}));

System.register("./utils-V7dpPPxq-UFoiAUZL.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      var __defProp = Object.defineProperty;
      var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
      var __publicField = (obj, key, value) => {
        __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
        return value;
      };
      var __accessCheck = (obj, member, msg) => {
        if (!member.has(obj))
          throw TypeError("Cannot " + msg);
      };
      var __privateGet = (obj, member, getter) => {
        __accessCheck(obj, member, "read from private field");
        return getter ? getter.call(obj) : member.get(obj);
      };
      var __privateAdd = (obj, member, value) => {
        if (member.has(obj))
          throw TypeError("Cannot add the same private member more than once");
        member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
      };
      var __privateSet = (obj, member, value, setter) => {
        __accessCheck(obj, member, "write to private field");
        setter ? setter.call(obj, value) : member.set(obj, value);
        return value;
      };
      var __privateWrapper = (obj, member, setter, getter) => ({
        set _(value) {
          __privateSet(obj, member, value, setter);
        },
        get _() {
          return __privateGet(obj, member, getter);
        }
      });
      var _head, _tail, _size;
      const getInfoElement = (name, document2) => {
        const infoTable = Array.from(document2.querySelectorAll(".view-page-details tr"));
        return infoTable.find((tr) => {
          var _a2, _b2;
          return (_b2 = (_a2 = tr.querySelector("td")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.includes(name);
        });
      };
      const getArrayText = (name, document2) => {
        const infoElement = getInfoElement(name, document2);
        if (!infoElement) {
          return;
        }
        return Array.from(infoElement.querySelectorAll("a")).map(
          (a) => a.childNodes[0].textContent.trim()
        );
      };
      const getData = exports("h", (document2) => {
        var _a2, _b2, _c, _d, _e, _f;
        const id = Number(
          document2.querySelector('a[href^="/read/"]').getAttribute("href").split("/").at(-1)
        );
        const title = document2.querySelector("h1.title").textContent;
        const description = (_c = (_b2 = (_a2 = getInfoElement("Description", document2)) == null ? void 0 : _a2.querySelector("td:last-of-type")) == null ? void 0 : _b2.textContent) == null ? void 0 : _c.trim();
        const artists = getArrayText("Artist", document2);
        const circles = getArrayText("Circle", document2);
        const magazines = getArrayText("Magazine", document2);
        const parodies = getArrayText("Parody", document2);
        const publishers = getArrayText("Publisher", document2);
        const published = (_f = (_e = (_d = getInfoElement("Published", document2)) == null ? void 0 : _d.querySelector("td:last-of-type")) == null ? void 0 : _e.textContent) == null ? void 0 : _f.trim();
        const pages = (() => {
          var _a3, _b3, _c2;
          const pagesText = (_c2 = (_b3 = (_a3 = getInfoElement("Pages", document2)) == null ? void 0 : _a3.querySelector("td:last-of-type")) == null ? void 0 : _b3.textContent) == null ? void 0 : _c2.trim();
          if (pagesText) {
            return parseInt(pagesText);
          }
        })();
        const favorites = (() => {
          var _a3, _b3, _c2;
          const favoritesText = (_c2 = (_b3 = (_a3 = getInfoElement("Favorites", document2)) == null ? void 0 : _a3.querySelector("td:last-of-type")) == null ? void 0 : _b3.textContent) == null ? void 0 : _c2.trim();
          if (favoritesText) {
            return parseInt(favoritesText);
          }
        })();
        const tags = (() => {
          var _a3;
          const tagsElement = (_a3 = getInfoElement("Tags", document2)) == null ? void 0 : _a3.querySelectorAll(".tag");
          if (tagsElement) {
            return Array.from(tagsElement).map((tag) => tag.textContent.trim().split("(")[0].trim());
          }
        })();
        return {
          id,
          title,
          description,
          artists,
          circles,
          magazines,
          parodies,
          publishers,
          published,
          pages,
          favorites,
          tags
        };
      });
      const getMetadata = exports("g", async (id) => {
        const res = await fetch(`/view/${id}`);
        if (!res.ok) {
          throw new Error(`[${res.status}] ${res.statusText} - Failed to get metadata for ${id}`);
        }
        const html = await res.text();
        const document2 = new DOMParser().parseFromString(html, "text/html");
        return getData(document2);
      });
      var ch2 = {};
      var wk = function(c, id, msg, transfer, cb) {
        var w = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([
          c + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'
        ], { type: "text/javascript" }))));
        w.onmessage = function(e) {
          var d = e.data, ed = d.$e$;
          if (ed) {
            var err2 = new Error(ed[0]);
            err2["code"] = ed[1];
            err2.stack = ed[2];
            cb(err2, null);
          } else
            cb(null, d);
        };
        w.postMessage(msg, transfer);
        return w;
      };
      var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
      var fleb = new u8([
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2,
        3,
        3,
        3,
        3,
        4,
        4,
        4,
        4,
        5,
        5,
        5,
        5,
        0,
        /* unused */
        0,
        0,
        /* impossible */
        0
      ]);
      var fdeb = new u8([
        0,
        0,
        0,
        0,
        1,
        1,
        2,
        2,
        3,
        3,
        4,
        4,
        5,
        5,
        6,
        6,
        7,
        7,
        8,
        8,
        9,
        9,
        10,
        10,
        11,
        11,
        12,
        12,
        13,
        13,
        /* unused */
        0,
        0
      ]);
      var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
      var freb = function(eb, start) {
        var b = new u16(31);
        for (var i = 0; i < 31; ++i) {
          b[i] = start += 1 << eb[i - 1];
        }
        var r = new i32(b[30]);
        for (var i = 1; i < 30; ++i) {
          for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = j - b[i] << 5 | i;
          }
        }
        return { b, r };
      };
      var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
      fl[28] = 258, revfl[258] = 28;
      var _b = freb(fdeb, 0), revfd = _b.r;
      var rev = new u16(32768);
      for (var i = 0; i < 32768; ++i) {
        var x = (i & 43690) >> 1 | (i & 21845) << 1;
        x = (x & 52428) >> 2 | (x & 13107) << 2;
        x = (x & 61680) >> 4 | (x & 3855) << 4;
        rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
      }
      var hMap = function(cd, mb, r) {
        var s = cd.length;
        var i = 0;
        var l = new u16(mb);
        for (; i < s; ++i) {
          if (cd[i])
            ++l[cd[i] - 1];
        }
        var le = new u16(mb);
        for (i = 1; i < mb; ++i) {
          le[i] = le[i - 1] + l[i - 1] << 1;
        }
        var co;
        if (r) {
          co = new u16(1 << mb);
          var rvb = 15 - mb;
          for (i = 0; i < s; ++i) {
            if (cd[i]) {
              var sv = i << 4 | cd[i];
              var r_1 = mb - cd[i];
              var v = le[cd[i] - 1]++ << r_1;
              for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
                co[rev[v] >> rvb] = sv;
              }
            }
          }
        } else {
          co = new u16(s);
          for (i = 0; i < s; ++i) {
            if (cd[i]) {
              co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
            }
          }
        }
        return co;
      };
      var flt = new u8(288);
      for (var i = 0; i < 144; ++i)
        flt[i] = 8;
      for (var i = 144; i < 256; ++i)
        flt[i] = 9;
      for (var i = 256; i < 280; ++i)
        flt[i] = 7;
      for (var i = 280; i < 288; ++i)
        flt[i] = 8;
      var fdt = new u8(32);
      for (var i = 0; i < 32; ++i)
        fdt[i] = 5;
      var flm = /* @__PURE__ */ hMap(flt, 9, 0);
      var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
      var shft = function(p) {
        return (p + 7) / 8 | 0;
      };
      var slc = function(v, s, e) {
        if (s == null || s < 0)
          s = 0;
        if (e == null || e > v.length)
          e = v.length;
        return new u8(v.subarray(s, e));
      };
      var ec = [
        "unexpected EOF",
        "invalid block type",
        "invalid length/literal",
        "invalid distance",
        "stream finished",
        "no stream handler",
        ,
        "no callback",
        "invalid UTF-8 data",
        "extra field too long",
        "date not in range 1980-2099",
        "filename too long",
        "stream finishing",
        "invalid zip data"
        // determined by unknown compression method
      ];
      var err = function(ind, msg, nt) {
        var e = new Error(msg || ec[ind]);
        e.code = ind;
        if (Error.captureStackTrace)
          Error.captureStackTrace(e, err);
        if (!nt)
          throw e;
        return e;
      };
      var wbits = function(d, p, v) {
        v <<= p & 7;
        var o = p / 8 | 0;
        d[o] |= v;
        d[o + 1] |= v >> 8;
      };
      var wbits16 = function(d, p, v) {
        v <<= p & 7;
        var o = p / 8 | 0;
        d[o] |= v;
        d[o + 1] |= v >> 8;
        d[o + 2] |= v >> 16;
      };
      var hTree = function(d, mb) {
        var t = [];
        for (var i = 0; i < d.length; ++i) {
          if (d[i])
            t.push({ s: i, f: d[i] });
        }
        var s = t.length;
        var t2 = t.slice();
        if (!s)
          return { t: et, l: 0 };
        if (s == 1) {
          var v = new u8(t[0].s + 1);
          v[t[0].s] = 1;
          return { t: v, l: 1 };
        }
        t.sort(function(a, b) {
          return a.f - b.f;
        });
        t.push({ s: -1, f: 25001 });
        var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
        t[0] = { s: -1, f: l.f + r.f, l, r };
        while (i1 != s - 1) {
          l = t[t[i0].f < t[i2].f ? i0++ : i2++];
          r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
          t[i1++] = { s: -1, f: l.f + r.f, l, r };
        }
        var maxSym = t2[0].s;
        for (var i = 1; i < s; ++i) {
          if (t2[i].s > maxSym)
            maxSym = t2[i].s;
        }
        var tr = new u16(maxSym + 1);
        var mbt = ln(t[i1 - 1], tr, 0);
        if (mbt > mb) {
          var i = 0, dt = 0;
          var lft = mbt - mb, cst = 1 << lft;
          t2.sort(function(a, b) {
            return tr[b.s] - tr[a.s] || a.f - b.f;
          });
          for (; i < s; ++i) {
            var i2_1 = t2[i].s;
            if (tr[i2_1] > mb) {
              dt += cst - (1 << mbt - tr[i2_1]);
              tr[i2_1] = mb;
            } else
              break;
          }
          dt >>= lft;
          while (dt > 0) {
            var i2_2 = t2[i].s;
            if (tr[i2_2] < mb)
              dt -= 1 << mb - tr[i2_2]++ - 1;
            else
              ++i;
          }
          for (; i >= 0 && dt; --i) {
            var i2_3 = t2[i].s;
            if (tr[i2_3] == mb) {
              --tr[i2_3];
              ++dt;
            }
          }
          mbt = mb;
        }
        return { t: new u8(tr), l: mbt };
      };
      var ln = function(n, l, d) {
        return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
      };
      var lc = function(c) {
        var s = c.length;
        while (s && !c[--s])
          ;
        var cl = new u16(++s);
        var cli = 0, cln = c[0], cls = 1;
        var w = function(v) {
          cl[cli++] = v;
        };
        for (var i = 1; i <= s; ++i) {
          if (c[i] == cln && i != s)
            ++cls;
          else {
            if (!cln && cls > 2) {
              for (; cls > 138; cls -= 138)
                w(32754);
              if (cls > 2) {
                w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
                cls = 0;
              }
            } else if (cls > 3) {
              w(cln), --cls;
              for (; cls > 6; cls -= 6)
                w(8304);
              if (cls > 2)
                w(cls - 3 << 5 | 8208), cls = 0;
            }
            while (cls--)
              w(cln);
            cls = 1;
            cln = c[i];
          }
        }
        return { c: cl.subarray(0, cli), n: s };
      };
      var clen = function(cf, cl) {
        var l = 0;
        for (var i = 0; i < cl.length; ++i)
          l += cf[i] * cl[i];
        return l;
      };
      var wfblk = function(out, pos, dat) {
        var s = dat.length;
        var o = shft(pos + 2);
        out[o] = s & 255;
        out[o + 1] = s >> 8;
        out[o + 2] = out[o] ^ 255;
        out[o + 3] = out[o + 1] ^ 255;
        for (var i = 0; i < s; ++i)
          out[o + i + 4] = dat[i];
        return (o + 4 + s) * 8;
      };
      var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
        wbits(out, p++, final);
        ++lf[256];
        var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
        var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
        var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
        var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
        var lcfreq = new u16(19);
        for (var i = 0; i < lclt.length; ++i)
          ++lcfreq[lclt[i] & 31];
        for (var i = 0; i < lcdt.length; ++i)
          ++lcfreq[lcdt[i] & 31];
        var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
        var nlcc = 19;
        for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
          ;
        var flen = bl + 5 << 3;
        var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
        var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
        if (bs >= 0 && flen <= ftlen && flen <= dtlen)
          return wfblk(out, p, dat.subarray(bs, bs + bl));
        var lm, ll, dm, dl;
        wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
        if (dtlen < ftlen) {
          lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
          var llm = hMap(lct, mlcb, 0);
          wbits(out, p, nlc - 257);
          wbits(out, p + 5, ndc - 1);
          wbits(out, p + 10, nlcc - 4);
          p += 14;
          for (var i = 0; i < nlcc; ++i)
            wbits(out, p + 3 * i, lct[clim[i]]);
          p += 3 * nlcc;
          var lcts = [lclt, lcdt];
          for (var it = 0; it < 2; ++it) {
            var clct = lcts[it];
            for (var i = 0; i < clct.length; ++i) {
              var len = clct[i] & 31;
              wbits(out, p, llm[len]), p += lct[len];
              if (len > 15)
                wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
            }
          }
        } else {
          lm = flm, ll = flt, dm = fdm, dl = fdt;
        }
        for (var i = 0; i < li; ++i) {
          var sym = syms[i];
          if (sym > 255) {
            var len = sym >> 18 & 31;
            wbits16(out, p, lm[len + 257]), p += ll[len + 257];
            if (len > 7)
              wbits(out, p, sym >> 23 & 31), p += fleb[len];
            var dst = sym & 31;
            wbits16(out, p, dm[dst]), p += dl[dst];
            if (dst > 3)
              wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
          } else {
            wbits16(out, p, lm[sym]), p += ll[sym];
          }
        }
        wbits16(out, p, lm[256]);
        return p + ll[256];
      };
      var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
      var et = /* @__PURE__ */ new u8(0);
      var dflt = function(dat, lvl, plvl, pre, post, st) {
        var s = st.z || dat.length;
        var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
        var w = o.subarray(pre, o.length - post);
        var lst = st.l;
        var pos = (st.r || 0) & 7;
        if (lvl) {
          if (pos)
            w[0] = st.r >> 3;
          var opt = deo[lvl - 1];
          var n = opt >> 13, c = opt & 8191;
          var msk_1 = (1 << plvl) - 1;
          var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
          var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
          var hsh = function(i2) {
            return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
          };
          var syms = new i32(25e3);
          var lf = new u16(288), df = new u16(32);
          var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
          for (; i + 2 < s; ++i) {
            var hv = hsh(i);
            var imod = i & 32767, pimod = head[hv];
            prev[imod] = pimod;
            head[hv] = imod;
            if (wi <= i) {
              var rem = s - i;
              if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
                pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
                li = lc_1 = eb = 0, bs = i;
                for (var j = 0; j < 286; ++j)
                  lf[j] = 0;
                for (var j = 0; j < 30; ++j)
                  df[j] = 0;
              }
              var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
              if (rem > 2 && hv == hsh(i - dif)) {
                var maxn = Math.min(n, rem) - 1;
                var maxd = Math.min(32767, i);
                var ml = Math.min(258, rem);
                while (dif <= maxd && --ch_1 && imod != pimod) {
                  if (dat[i + l] == dat[i + l - dif]) {
                    var nl = 0;
                    for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                      ;
                    if (nl > l) {
                      l = nl, d = dif;
                      if (nl > maxn)
                        break;
                      var mmd = Math.min(dif, nl - 2);
                      var md = 0;
                      for (var j = 0; j < mmd; ++j) {
                        var ti = i - dif + j & 32767;
                        var pti = prev[ti];
                        var cd = ti - pti & 32767;
                        if (cd > md)
                          md = cd, pimod = ti;
                      }
                    }
                  }
                  imod = pimod, pimod = prev[imod];
                  dif += imod - pimod & 32767;
                }
              }
              if (d) {
                syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
                var lin = revfl[l] & 31, din = revfd[d] & 31;
                eb += fleb[lin] + fdeb[din];
                ++lf[257 + lin];
                ++df[din];
                wi = i + l;
                ++lc_1;
              } else {
                syms[li++] = dat[i];
                ++lf[dat[i]];
              }
            }
          }
          for (i = Math.max(i, wi); i < s; ++i) {
            syms[li++] = dat[i];
            ++lf[dat[i]];
          }
          pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
          if (!lst) {
            st.r = pos & 7 | w[pos / 8 | 0] << 3;
            pos -= 7;
            st.h = head, st.p = prev, st.i = i, st.w = wi;
          }
        } else {
          for (var i = st.w || 0; i < s + lst; i += 65535) {
            var e = i + 65535;
            if (e >= s) {
              w[pos / 8 | 0] = lst;
              e = s;
            }
            pos = wfblk(w, pos + 1, dat.subarray(i, e));
          }
          st.i = s;
        }
        return slc(o, 0, pre + shft(pos) + post);
      };
      var crct = /* @__PURE__ */ function() {
        var t = new Int32Array(256);
        for (var i = 0; i < 256; ++i) {
          var c = i, k = 9;
          while (--k)
            c = (c & 1 && -306674912) ^ c >>> 1;
          t[i] = c;
        }
        return t;
      }();
      var crc = function() {
        var c = -1;
        return {
          p: function(d) {
            var cr = c;
            for (var i = 0; i < d.length; ++i)
              cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
            c = cr;
          },
          d: function() {
            return ~c;
          }
        };
      };
      var dopt = function(dat, opt, pre, post, st) {
        if (!st) {
          st = { l: 1 };
          if (opt.dictionary) {
            var dict = opt.dictionary.subarray(-32768);
            var newDat = new u8(dict.length + dat.length);
            newDat.set(dict);
            newDat.set(dat, dict.length);
            dat = newDat;
            st.w = dict.length;
          }
        }
        return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 12 + opt.mem, pre, post, st);
      };
      var mrg = function(a, b) {
        var o = {};
        for (var k in a)
          o[k] = a[k];
        for (var k in b)
          o[k] = b[k];
        return o;
      };
      var wcln = function(fn, fnStr, td2) {
        var dt = fn();
        var st = fn.toString();
        var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
        for (var i = 0; i < dt.length; ++i) {
          var v = dt[i], k = ks[i];
          if (typeof v == "function") {
            fnStr += ";" + k + "=";
            var st_1 = v.toString();
            if (v.prototype) {
              if (st_1.indexOf("[native code]") != -1) {
                var spInd = st_1.indexOf(" ", 8) + 1;
                fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
              } else {
                fnStr += st_1;
                for (var t in v.prototype)
                  fnStr += ";" + k + ".prototype." + t + "=" + v.prototype[t].toString();
              }
            } else
              fnStr += st_1;
          } else
            td2[k] = v;
        }
        return fnStr;
      };
      var ch = [];
      var cbfs = function(v) {
        var tl = [];
        for (var k in v) {
          if (v[k].buffer) {
            tl.push((v[k] = new v[k].constructor(v[k])).buffer);
          }
        }
        return tl;
      };
      var wrkr = function(fns, init, id, cb) {
        if (!ch[id]) {
          var fnStr = "", td_1 = {}, m = fns.length - 1;
          for (var i = 0; i < m; ++i)
            fnStr = wcln(fns[i], fnStr, td_1);
          ch[id] = { c: wcln(fns[m], fnStr, td_1), e: td_1 };
        }
        var td2 = mrg({}, ch[id].e);
        return wk(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init.toString() + "}", id, td2, cbfs(td2), cb);
      };
      var bDflt = function() {
        return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
      };
      var pbf = function(msg) {
        return postMessage(msg, [msg.buffer]);
      };
      var astrm = function(strm) {
        strm.ondata = function(dat, final) {
          return postMessage([dat, final], [dat.buffer]);
        };
        return function(ev) {
          return strm.push(ev.data[0], ev.data[1]);
        };
      };
      var astrmify = function(fns, strm, opts, init, id, ext) {
        var t;
        var w = wrkr(fns, init, id, function(err2, dat) {
          if (err2)
            w.terminate(), strm.ondata.call(strm, err2);
          else if (!Array.isArray(dat))
            ext(dat);
          else {
            if (dat[1])
              w.terminate();
            strm.ondata.call(strm, err2, dat[0], dat[1]);
          }
        });
        w.postMessage(opts);
        strm.push = function(d, f) {
          if (!strm.ondata)
            err(5);
          if (t)
            strm.ondata(err(4, 0, 1), null, !!f);
          w.postMessage([d, t = f], [d.buffer]);
        };
        strm.terminate = function() {
          w.terminate();
        };
      };
      var wbytes = function(d, b, v) {
        for (; v; ++b)
          d[b] = v, v >>>= 8;
      };
      function StrmOpt(opts, cb) {
        if (typeof opts == "function")
          cb = opts, opts = {};
        this.ondata = cb;
        return opts;
      }
      var Deflate = /* @__PURE__ */ function() {
        function Deflate2(opts, cb) {
          if (typeof opts == "function")
            cb = opts, opts = {};
          this.ondata = cb;
          this.o = opts || {};
          this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
          this.b = new u8(98304);
          if (this.o.dictionary) {
            var dict = this.o.dictionary.subarray(-32768);
            this.b.set(dict, 32768 - dict.length);
            this.s.i = 32768 - dict.length;
          }
        }
        Deflate2.prototype.p = function(c, f) {
          this.ondata(dopt(c, this.o, 0, 0, this.s), f);
        };
        Deflate2.prototype.push = function(chunk, final) {
          if (!this.ondata)
            err(5);
          if (this.s.l)
            err(4);
          var endLen = chunk.length + this.s.z;
          if (endLen > this.b.length) {
            if (endLen > 2 * this.b.length - 32768) {
              var newBuf = new u8(endLen & -32768);
              newBuf.set(this.b.subarray(0, this.s.z));
              this.b = newBuf;
            }
            var split = this.b.length - this.s.z;
            if (split) {
              this.b.set(chunk.subarray(0, split), this.s.z);
              this.s.z = this.b.length;
              this.p(this.b, false);
            }
            this.b.set(this.b.subarray(-32768));
            this.b.set(chunk.subarray(split), 32768);
            this.s.z = chunk.length - split + 32768;
            this.s.i = 32766, this.s.w = 32768;
          } else {
            this.b.set(chunk, this.s.z);
            this.s.z += chunk.length;
          }
          this.s.l = final & 1;
          if (this.s.z > this.s.w + 8191 || final) {
            this.p(this.b, final || false);
            this.s.w = this.s.i, this.s.i -= 2;
          }
        };
        return Deflate2;
      }();
      var AsyncDeflate = /* @__PURE__ */ function() {
        function AsyncDeflate2(opts, cb) {
          astrmify([
            bDflt,
            function() {
              return [astrm, Deflate];
            }
          ], this, StrmOpt.call(this, opts, cb), function(ev) {
            var strm = new Deflate(ev.data);
            onmessage = astrm(strm);
          }, 6);
        }
        return AsyncDeflate2;
      }();
      function deflateSync(data, opts) {
        return dopt(data, opts || {}, 0, 0);
      }
      var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
      var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
      var tds = 0;
      try {
        td.decode(et, { stream: true });
        tds = 1;
      } catch (e) {
      }
      function strToU8(str, latin1) {
        if (latin1) {
          var ar_1 = new u8(str.length);
          for (var i = 0; i < str.length; ++i)
            ar_1[i] = str.charCodeAt(i);
          return ar_1;
        }
        if (te)
          return te.encode(str);
        var l = str.length;
        var ar = new u8(str.length + (str.length >> 1));
        var ai = 0;
        var w = function(v) {
          ar[ai++] = v;
        };
        for (var i = 0; i < l; ++i) {
          if (ai + 5 > ar.length) {
            var n = new u8(ai + 8 + (l - i << 1));
            n.set(ar);
            ar = n;
          }
          var c = str.charCodeAt(i);
          if (c < 128 || latin1)
            w(c);
          else if (c < 2048)
            w(192 | c >> 6), w(128 | c & 63);
          else if (c > 55295 && c < 57344)
            c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
          else
            w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
        }
        return slc(ar, 0, ai);
      }
      var dbf = function(l) {
        return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
      };
      var exfl = function(ex) {
        var le = 0;
        if (ex) {
          for (var k in ex) {
            var l = ex[k].length;
            if (l > 65535)
              err(9);
            le += l + 4;
          }
        }
        return le;
      };
      var wzh = function(d, b, f, fn, u, c, ce, co) {
        var fl2 = fn.length, ex = f.extra, col = co && co.length;
        var exl = exfl(ex);
        wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
        if (ce != null)
          d[b++] = 20, d[b++] = f.os;
        d[b] = 20, b += 2;
        d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
        d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
        var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
        if (y < 0 || y > 119)
          err(10);
        wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
        if (c != -1) {
          wbytes(d, b, f.crc);
          wbytes(d, b + 4, c < 0 ? -c - 2 : c);
          wbytes(d, b + 8, f.size);
        }
        wbytes(d, b + 12, fl2);
        wbytes(d, b + 14, exl), b += 16;
        if (ce != null) {
          wbytes(d, b, col);
          wbytes(d, b + 6, f.attrs);
          wbytes(d, b + 10, ce), b += 14;
        }
        d.set(fn, b);
        b += fl2;
        if (exl) {
          for (var k in ex) {
            var exf = ex[k], l = exf.length;
            wbytes(d, b, +k);
            wbytes(d, b + 2, l);
            d.set(exf, b + 4), b += 4 + l;
          }
        }
        if (col)
          d.set(co, b), b += col;
        return b;
      };
      var wzf = function(o, b, c, d, e) {
        wbytes(o, b, 101010256);
        wbytes(o, b + 8, c);
        wbytes(o, b + 10, c);
        wbytes(o, b + 12, d);
        wbytes(o, b + 16, e);
      };
      var ZipPassThrough = /* @__PURE__ */ function() {
        function ZipPassThrough2(filename) {
          this.filename = filename;
          this.c = crc();
          this.size = 0;
          this.compression = 0;
        }
        ZipPassThrough2.prototype.process = function(chunk, final) {
          this.ondata(null, chunk, final);
        };
        ZipPassThrough2.prototype.push = function(chunk, final) {
          if (!this.ondata)
            err(5);
          this.c.p(chunk);
          this.size += chunk.length;
          if (final)
            this.crc = this.c.d();
          this.process(chunk, final || false);
        };
        return ZipPassThrough2;
      }();
      var AsyncZipDeflate = /* @__PURE__ */ function() {
        function AsyncZipDeflate2(filename, opts) {
          var _this_1 = this;
          if (!opts)
            opts = {};
          ZipPassThrough.call(this, filename);
          this.d = new AsyncDeflate(opts, function(err2, dat, final) {
            _this_1.ondata(err2, dat, final);
          });
          this.compression = 8;
          this.flag = dbf(opts.level);
          this.terminate = this.d.terminate;
        }
        AsyncZipDeflate2.prototype.process = function(chunk, final) {
          this.d.push(chunk, final);
        };
        AsyncZipDeflate2.prototype.push = function(chunk, final) {
          ZipPassThrough.prototype.push.call(this, chunk, final);
        };
        return AsyncZipDeflate2;
      }();
      var Zip = /* @__PURE__ */ function() {
        function Zip2(cb) {
          this.ondata = cb;
          this.u = [];
          this.d = 1;
        }
        Zip2.prototype.add = function(file) {
          var _this_1 = this;
          if (!this.ondata)
            err(5);
          if (this.d & 2)
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
          else {
            var f = strToU8(file.filename), fl_1 = f.length;
            var com = file.comment, o = com && strToU8(com);
            var u = fl_1 != file.filename.length || o && com.length != o.length;
            var hl_1 = fl_1 + exfl(file.extra) + 30;
            if (fl_1 > 65535)
              this.ondata(err(11, 0, 1), null, false);
            var header = new u8(hl_1);
            wzh(header, 0, file, f, u, -1);
            var chks_1 = [header];
            var pAll_1 = function() {
              for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
                var chk = chks_2[_i];
                _this_1.ondata(null, chk, false);
              }
              chks_1 = [];
            };
            var tr_1 = this.d;
            this.d = 0;
            var ind_1 = this.u.length;
            var uf_1 = mrg(file, {
              f,
              u,
              o,
              t: function() {
                if (file.terminate)
                  file.terminate();
              },
              r: function() {
                pAll_1();
                if (tr_1) {
                  var nxt = _this_1.u[ind_1 + 1];
                  if (nxt)
                    nxt.r();
                  else
                    _this_1.d = 1;
                }
                tr_1 = 1;
              }
            });
            var cl_1 = 0;
            file.ondata = function(err2, dat, final) {
              if (err2) {
                _this_1.ondata(err2, dat, final);
                _this_1.terminate();
              } else {
                cl_1 += dat.length;
                chks_1.push(dat);
                if (final) {
                  var dd = new u8(16);
                  wbytes(dd, 0, 134695760);
                  wbytes(dd, 4, file.crc);
                  wbytes(dd, 8, cl_1);
                  wbytes(dd, 12, file.size);
                  chks_1.push(dd);
                  uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                  if (tr_1)
                    uf_1.r();
                  tr_1 = 1;
                } else if (tr_1)
                  pAll_1();
              }
            };
            this.u.push(uf_1);
          }
        };
        Zip2.prototype.end = function() {
          var _this_1 = this;
          if (this.d & 2) {
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
            return;
          }
          if (this.d)
            this.e();
          else
            this.u.push({
              r: function() {
                if (!(_this_1.d & 1))
                  return;
                _this_1.u.splice(-1, 1);
                _this_1.e();
              },
              t: function() {
              }
            });
          this.d = 3;
        };
        Zip2.prototype.e = function() {
          var bt = 0, l = 0, tl = 0;
          for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
            var f = _a2[_i];
            tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
          }
          var out = new u8(tl + 22);
          for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
            var f = _c[_b2];
            wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
            bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
          }
          wzf(out, bt, this.u.length, tl, l);
          this.ondata(null, out, true);
          this.d = 2;
        };
        Zip2.prototype.terminate = function() {
          for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
            var f = _a2[_i];
            f.t();
          }
          this.d = 2;
        };
        return Zip2;
      }();
      class Node {
        constructor(value) {
          __publicField(this, "value");
          __publicField(this, "next");
          this.value = value;
        }
      }
      class Queue {
        constructor() {
          __privateAdd(this, _head, void 0);
          __privateAdd(this, _tail, void 0);
          __privateAdd(this, _size, void 0);
          this.clear();
        }
        enqueue(value) {
          const node = new Node(value);
          if (__privateGet(this, _head)) {
            __privateGet(this, _tail).next = node;
            __privateSet(this, _tail, node);
          } else {
            __privateSet(this, _head, node);
            __privateSet(this, _tail, node);
          }
          __privateWrapper(this, _size)._++;
        }
        dequeue() {
          const current = __privateGet(this, _head);
          if (!current) {
            return;
          }
          __privateSet(this, _head, __privateGet(this, _head).next);
          __privateWrapper(this, _size)._--;
          return current.value;
        }
        clear() {
          __privateSet(this, _head, void 0);
          __privateSet(this, _tail, void 0);
          __privateSet(this, _size, 0);
        }
        get size() {
          return __privateGet(this, _size);
        }
        *[Symbol.iterator]() {
          let current = __privateGet(this, _head);
          while (current) {
            yield current.value;
            current = current.next;
          }
        }
      }
      _head = new WeakMap();
      _tail = new WeakMap();
      _size = new WeakMap();
      const AsyncResource = {
        bind(fn, _type, thisArg) {
          return fn.bind(thisArg);
        }
      };
      function pLimit(concurrency) {
        if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
          throw new TypeError("Expected `concurrency` to be a number from 1 and up");
        }
        const queue = new Queue();
        let activeCount = 0;
        const next = () => {
          activeCount--;
          if (queue.size > 0) {
            queue.dequeue()();
          }
        };
        const run = async (function_, resolve, arguments_) => {
          activeCount++;
          const result = (async () => function_(...arguments_))();
          resolve(result);
          try {
            await result;
          } catch {
          }
          next();
        };
        const enqueue = (function_, resolve, arguments_) => {
          queue.enqueue(
            AsyncResource.bind(run.bind(void 0, function_, resolve, arguments_))
          );
          (async () => {
            await Promise.resolve();
            if (activeCount < concurrency && queue.size > 0) {
              queue.dequeue()();
            }
          })();
        };
        const generator = (function_, ...arguments_) => new Promise((resolve) => {
          enqueue(function_, resolve, arguments_);
        });
        Object.defineProperties(generator, {
          activeCount: {
            get: () => activeCount
          },
          pendingCount: {
            get: () => queue.size
          },
          clearQueue: {
            value() {
              queue.clear();
            }
          }
        });
        return generator;
      }
      var StreamSaver = { exports: {} };
      /*! streamsaver. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
      (function(module) {
        ((name, definition) => {
          module.exports = definition();
        })("streamSaver", () => {
          const global = typeof window === "object" ? window : this;
          if (!global.HTMLElement)
            console.warn("streamsaver is meant to run on browsers main thread");
          let mitmTransporter = null;
          let supportsTransferable = false;
          const test = (fn) => {
            try {
              fn();
            } catch (e) {
            }
          };
          const ponyfill = global.WebStreamsPolyfill || {};
          const isSecureContext = global.isSecureContext;
          let useBlobFallback = /constructor/i.test(global.HTMLElement) || !!global.safari || !!global.WebKitPoint;
          const downloadStrategy = isSecureContext || "MozAppearance" in document.documentElement.style ? "iframe" : "navigate";
          const streamSaver = {
            createWriteStream,
            WritableStream: global.WritableStream || ponyfill.WritableStream,
            supported: true,
            version: { full: "2.0.5", major: 2, minor: 0, dot: 5 },
            mitm: "https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0"
          };
          function makeIframe(src) {
            if (!src)
              throw new Error("meh");
            const iframe = document.createElement("iframe");
            iframe.hidden = true;
            iframe.src = src;
            iframe.loaded = false;
            iframe.name = "iframe";
            iframe.isIframe = true;
            iframe.postMessage = (...args) => iframe.contentWindow.postMessage(...args);
            iframe.addEventListener("load", () => {
              iframe.loaded = true;
            }, { once: true });
            document.body.appendChild(iframe);
            return iframe;
          }
          function makePopup(src) {
            const options = "width=200,height=100";
            const delegate = document.createDocumentFragment();
            const popup = {
              frame: global.open(src, "popup", options),
              loaded: false,
              isIframe: false,
              isPopup: true,
              remove() {
                popup.frame.close();
              },
              addEventListener(...args) {
                delegate.addEventListener(...args);
              },
              dispatchEvent(...args) {
                delegate.dispatchEvent(...args);
              },
              removeEventListener(...args) {
                delegate.removeEventListener(...args);
              },
              postMessage(...args) {
                popup.frame.postMessage(...args);
              }
            };
            const onReady = (evt) => {
              if (evt.source === popup.frame) {
                popup.loaded = true;
                global.removeEventListener("message", onReady);
                popup.dispatchEvent(new Event("load"));
              }
            };
            global.addEventListener("message", onReady);
            return popup;
          }
          try {
            new Response(new ReadableStream());
            if (isSecureContext && !("serviceWorker" in navigator)) {
              useBlobFallback = true;
            }
          } catch (err2) {
            useBlobFallback = true;
          }
          test(() => {
            const { readable } = new TransformStream();
            const mc = new MessageChannel();
            mc.port1.postMessage(readable, [readable]);
            mc.port1.close();
            mc.port2.close();
            supportsTransferable = true;
            Object.defineProperty(streamSaver, "TransformStream", {
              configurable: false,
              writable: false,
              value: TransformStream
            });
          });
          function loadTransporter() {
            if (!mitmTransporter) {
              mitmTransporter = isSecureContext ? makeIframe(streamSaver.mitm) : makePopup(streamSaver.mitm);
            }
          }
          function createWriteStream(filename, options, size) {
            let opts = {
              size: null,
              pathname: null,
              writableStrategy: void 0,
              readableStrategy: void 0
            };
            let bytesWritten = 0;
            let downloadUrl = null;
            let channel = null;
            let ts = null;
            if (Number.isFinite(options)) {
              [size, options] = [options, size];
              console.warn("[StreamSaver] Deprecated pass an object as 2nd argument when creating a write stream");
              opts.size = size;
              opts.writableStrategy = options;
            } else if (options && options.highWaterMark) {
              console.warn("[StreamSaver] Deprecated pass an object as 2nd argument when creating a write stream");
              opts.size = size;
              opts.writableStrategy = options;
            } else {
              opts = options || {};
            }
            if (!useBlobFallback) {
              loadTransporter();
              channel = new MessageChannel();
              filename = encodeURIComponent(filename.replace(/\//g, ":")).replace(/['()]/g, escape).replace(/\*/g, "%2A");
              const response = {
                transferringReadable: supportsTransferable,
                pathname: opts.pathname || Math.random().toString().slice(-6) + "/" + filename,
                headers: {
                  "Content-Type": "application/octet-stream; charset=utf-8",
                  "Content-Disposition": "attachment; filename*=UTF-8''" + filename
                }
              };
              if (opts.size) {
                response.headers["Content-Length"] = opts.size;
              }
              const args = [response, "*", [channel.port2]];
              if (supportsTransferable) {
                const transformer = downloadStrategy === "iframe" ? void 0 : {
                  // This transformer & flush method is only used by insecure context.
                  transform(chunk, controller) {
                    if (!(chunk instanceof Uint8Array)) {
                      throw new TypeError("Can only write Uint8Arrays");
                    }
                    bytesWritten += chunk.length;
                    controller.enqueue(chunk);
                    if (downloadUrl) {
                      location.href = downloadUrl;
                      downloadUrl = null;
                    }
                  },
                  flush() {
                    if (downloadUrl) {
                      location.href = downloadUrl;
                    }
                  }
                };
                ts = new streamSaver.TransformStream(
                  transformer,
                  opts.writableStrategy,
                  opts.readableStrategy
                );
                const readableStream = ts.readable;
                channel.port1.postMessage({ readableStream }, [readableStream]);
              }
              channel.port1.onmessage = (evt) => {
                if (evt.data.download) {
                  if (downloadStrategy === "navigate") {
                    mitmTransporter.remove();
                    mitmTransporter = null;
                    if (bytesWritten) {
                      location.href = evt.data.download;
                    } else {
                      downloadUrl = evt.data.download;
                    }
                  } else {
                    if (mitmTransporter.isPopup) {
                      mitmTransporter.remove();
                      mitmTransporter = null;
                      if (downloadStrategy === "iframe") {
                        makeIframe(streamSaver.mitm);
                      }
                    }
                    makeIframe(evt.data.download);
                  }
                } else if (evt.data.abort) {
                  chunks = [];
                  channel.port1.postMessage("abort");
                  channel.port1.onmessage = null;
                  channel.port1.close();
                  channel.port2.close();
                  channel = null;
                }
              };
              if (mitmTransporter.loaded) {
                mitmTransporter.postMessage(...args);
              } else {
                mitmTransporter.addEventListener("load", () => {
                  mitmTransporter.postMessage(...args);
                }, { once: true });
              }
            }
            let chunks = [];
            return !useBlobFallback && ts && ts.writable || new streamSaver.WritableStream({
              write(chunk) {
                if (!(chunk instanceof Uint8Array)) {
                  throw new TypeError("Can only write Uint8Arrays");
                }
                if (useBlobFallback) {
                  chunks.push(chunk);
                  return;
                }
                channel.port1.postMessage(chunk);
                bytesWritten += chunk.length;
                if (downloadUrl) {
                  location.href = downloadUrl;
                  downloadUrl = null;
                }
              },
              close() {
                if (useBlobFallback) {
                  const blob = new Blob(chunks, { type: "application/octet-stream; charset=utf-8" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = filename;
                  link.click();
                } else {
                  channel.port1.postMessage("end");
                }
              },
              abort() {
                chunks = [];
                channel.port1.postMessage("abort");
                channel.port1.onmessage = null;
                channel.port1.close();
                channel.port2.close();
                channel = null;
              }
            }, opts.writableStrategy);
          }
          return streamSaver;
        });
      })(StreamSaver);
      var StreamSaverExports = StreamSaver.exports;
      const primeNumbers = [2, 3, 5, 7, 11, 13, 17, 19];
      const limit = pLimit(4);
      const generateFilename = ({ title, artists, magazines }) => {
        const splits = [];
        if (artists) {
          if (artists.length === 1) {
            splits.push(`[${artists[0]}]`);
          } else if (artists.length === 2) {
            splits.push(`[${artists[0]} & ${artists[1]}]`);
          } else if (artists.length >= 3) {
            splits.push("[Various]");
          }
        }
        splits.push(title);
        if ((magazines == null ? void 0 : magazines.length) === 1) {
          splits.push(`(${magazines[0]})`);
        }
        return splits.join(" ").replace("＊", "*").replace("？", "?").replace("⁄", "/").replace("Ꞓ", ":");
      };
      const base64ToBytes = (encoded) => {
        const binaryString = atob(encoded);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };
      const decryptData = (encoded) => {
        const hostname = "hentainexus.com";
        const data = base64ToBytes(encoded);
        for (let i = 0; i < hostname.length; i++) {
          data[i] ^= hostname.charCodeAt(i);
        }
        const keyStream = data.slice(0, 64).map((byte) => byte & 255);
        const ciphertext = data.slice(64).map((byte) => byte & 255);
        const digest = [...Array(256).keys()];
        let primeIdx = 0;
        for (let i = 0; i < 64; i++) {
          primeIdx ^= keyStream[i];
          for (let j = 0; j < 8; j++) {
            primeIdx = (primeIdx & 1) !== 0 ? primeIdx >>> 1 ^ 12 : primeIdx >>> 1;
          }
        }
        primeIdx &= 7;
        let temp;
        let key = 0;
        for (let i = 0; i < 256; i++) {
          key = (key + digest[i] + keyStream[i % 64]) % 256;
          temp = digest[i];
          digest[i] = digest[key];
          digest[key] = temp;
        }
        const q = primeNumbers[primeIdx];
        let k = 0;
        let n = 0;
        let p = 0;
        let xorKey = 0;
        let result = "";
        for (let i = 0; i < ciphertext.length; i++) {
          k = (k + q) % 256;
          n = (p + digest[(n + digest[k]) % 256]) % 256;
          p = (p + k + digest[k]) % 256;
          temp = digest[k];
          digest[k] = digest[n];
          digest[n] = temp;
          xorKey = digest[(n + digest[(k + digest[(xorKey + p) % 256]) % 256]) % 256];
          result += String.fromCharCode(ciphertext[i] ^ xorKey);
        }
        return result;
      };
      const fetchImage = async (image, zip) => {
        const response = await fetch(image.image);
        const blob = await response.blob();
        const extension = blob.type.split("/").at(-1);
        const imageFile = new ZipPassThrough(`${image.url_label}.${extension}`);
        zip.add(imageFile);
        await blob.arrayBuffer().then((buffer) => {
          imageFile.push(new Uint8Array(buffer), true);
        });
      };
      const startDownload = exports("s", async (metadata, images, setProgress) => {
        return new Promise((resolve, reject) => {
          var _a2, _b2, _c, _d;
          const fileStream = StreamSaverExports.createWriteStream(`${generateFilename(metadata)}.cbz`);
          const writer = fileStream.getWriter();
          const zip = new Zip();
          zip.ondata = async (err2, chunk, final) => {
            if (!err2) {
              writer.write(chunk);
              if (final) {
                writer.close();
              }
            } else {
              writer.abort();
              reject(err2);
            }
          };
          const metadataFile = new AsyncZipDeflate("info.json");
          zip.add(metadataFile);
          metadataFile.push(
            strToU8(
              JSON.stringify(
                {
                  Title: metadata.title,
                  Description: metadata.description,
                  Artist: (_a2 = metadata.artists) == null ? void 0 : _a2.join(", "),
                  Groups: metadata.circles,
                  Magazine: (_b2 = metadata.magazines) == null ? void 0 : _b2.join(", "),
                  Parody: (_c = metadata.parodies) == null ? void 0 : _c.join(", "),
                  Publisher: (_d = metadata.publishers) == null ? void 0 : _d.join(", "),
                  Published: metadata.published && new Date(metadata.published).getTime() / 1e3,
                  Pages: metadata.pages,
                  Favorites: metadata.favorites,
                  Tags: metadata.tags,
                  Source: `https://hentainexus.com/view/${metadata.id}`
                },
                null,
                2
              )
            ),
            true
          );
          let progress = 0;
          Promise.all(
            images.map(
              (image) => limit(
                () => fetchImage(image, zip).then(() => {
                  progress++;
                  setProgress(progress);
                })
              )
            )
          ).then(() => {
            zip.end();
            resolve();
          });
          const beforeUnloadHandler = () => writer.abort();
          window.addEventListener("beforeunload", beforeUnloadHandler);
          writer.closed.then(() => window.removeEventListener("beforeunload", beforeUnloadHandler));
        });
      });
      const getImages = exports("b", async (id) => {
        const res = await fetch(`/read/${id}`);
        if (!res.ok) {
          throw new Error(`[${res.status}] ${res.statusText} - Failed to get images for ${id}`);
        }
        const html = await res.text();
        const document2 = new DOMParser().parseFromString(html, "text/html");
        const readerScript = Array.from(document2.querySelectorAll("script")).find(
          (script) => script.innerHTML.includes("initReader")
        ).innerHTML;
        const encoded = readerScript.match(/initReader\("([^"]*)"/)[1];
        const images = JSON.parse(decryptData(encoded)).filter(
          (image) => image.type === "image"
        );
        const stripFilter = localStorage.getItem("strip_filter") === "true";
        if (stripFilter) {
          return images.map((image) => ({ ...image, image: image.image.replace("?filter=null", "") }));
        }
        return images;
      });
      const downloadIcon = exports("a", '<svg xmlns="http://www.w3.org/2000/svg" width="1.2rem" height="1.2rem" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21v-1h14v1zm6.98-3.77L6.366 9.789h3.27V3h4.711v6.788h3.27z"/></svg>');
      const spinnerIcon = exports("i", '<svg xmlns="http://www.w3.org/2000/svg" class="animate-spin" width="1.3rem" height="1.3rem" viewBox="0 0 24 24"><g fill="currentColor"><path fill-rule="evenodd" d="M12 19a7 7 0 1 0 0-14a7 7 0 0 0 0 14m0 3c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10" clip-rule="evenodd" opacity=".2"/><path d="M2 12C2 6.477 6.477 2 12 2v3a7 7 0 0 0-7 7z"/></g></svg>');
      const xMarkIcon = exports("x", '<svg xmlns="http://www.w3.org/2000/svg" width="1.3rem" height="1.3rem" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8L3.47 4.53a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/></svg>');
      function noop() {
      }
      function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
      }
      const subscriber_queue = [];
      function writable(value, start = noop) {
        let stop;
        const subscribers = /* @__PURE__ */ new Set();
        function set(new_value) {
          if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) {
              const run_queue = !subscriber_queue.length;
              for (const subscriber of subscribers) {
                subscriber[1]();
                subscriber_queue.push(subscriber, value);
              }
              if (run_queue) {
                for (let i = 0; i < subscriber_queue.length; i += 2) {
                  subscriber_queue[i][0](subscriber_queue[i + 1]);
                }
                subscriber_queue.length = 0;
              }
            }
          }
        }
        function update(fn) {
          set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
          const subscriber = [run, invalidate];
          subscribers.add(subscriber);
          if (subscribers.size === 1) {
            stop = start(set, update) || noop;
          }
          run(value);
          return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0 && stop) {
              stop();
              stop = null;
            }
          };
        }
        return { set, update, subscribe };
      }
      const createDownloadedStore = () => {
        const downloaded2 = JSON.parse(localStorage.getItem("downloads") || "[]");
        const { set, subscribe } = writable(downloaded2);
        const get = () => downloaded2;
        const add = (id) => {
          if (!downloaded2.includes(id)) {
            downloaded2.push(id);
          }
          set(downloaded2);
          localStorage.setItem("downloads", JSON.stringify(downloaded2));
        };
        const includes = (id) => downloaded2.includes(id);
        return {
          get,
          add,
          includes,
          subscribe
        };
      };
      const downloaded = exports("d", createDownloadedStore());
      const getIdFromElement = (element) => Number(element.querySelector("a").getAttribute("href").split("/").at(-1));
      const createLibraryItemDownloadStateManager = exports("c", (elements) => {
        const start = ({ id, title }) => {
          const element = elements.find((element2) => id === getIdFromElement(element2));
          if (element) {
            const button = element.querySelector('button[role="download"]');
            button.setAttribute("state", "processing");
            button.classList.add("disabled");
            button.classList.remove("downloaded", "failed");
            button.innerHTML = spinnerIcon;
            console.log(`Started download for (${id}) '${title}'`);
          }
        };
        const progress = ({ id }, progress2, total) => {
          const element = elements.find((element2) => id === getIdFromElement(element2));
          if (element) {
            const progressText = element.querySelector(`span[download="${id}"]`);
            progressText.innerHTML = `${progress2}/${total}`;
          }
        };
        const finish = ({ id, title }) => {
          const element = elements.find((element2) => id === getIdFromElement(element2));
          if (element) {
            const button = element.querySelector('button[role="download"]');
            button.innerHTML = downloadIcon;
            console.log(`Finished download for (${id}) '${title}'`);
            finalize(id);
          }
        };
        const fail = ({ id, title }, err2) => {
          const element = elements.find((element2) => id === getIdFromElement(element2));
          if (element) {
            const button = element.querySelector('button[role="download"]');
            button.classList.add("failed");
            button.innerHTML = xMarkIcon;
            console.error(`Failed download for (${id}) '${title}'`, err2);
            finalize(id);
          }
        };
        const finalize = (id) => {
          const element = elements.find((element2) => id === getIdFromElement(element2));
          const button = element.querySelector('button[role="download"]');
          button.setAttribute("state", "idle");
          button.classList.remove("disabled");
          const progressText = element.querySelector(`span[download="${id}"]`);
          progressText.innerHTML = "";
        };
        return {
          start,
          progress,
          finish,
          fail
        };
      });
      const createDownloadStateStore = exports("f", () => {
        const { update, subscribe } = writable({ kind: "idle" });
        const idle = () => {
          update((state) => ({ ...state, kind: "idle" }));
        };
        const starting = () => {
          update((state) => ({ ...state, kind: "starting" }));
        };
        const processing = (progress, total) => {
          update((state) => ({ ...state, kind: "processing", progress, total }));
        };
        const success = (progress, total) => {
          update((state) => ({ ...state, kind: "success", progress, total }));
        };
        const fail = () => {
          update((state) => ({ ...state, kind: "failed" }));
        };
        return {
          idle,
          starting,
          processing,
          success,
          fail,
          subscribe
        };
      });
      const sleep = exports("e", (time) => new Promise((r) => setTimeout(r, time)));

    })
  };
}));

System.register("./settings-_03oqxPd-XE-OHLWG.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      const buildCheckboxField = ({ name, description, value }) => {
        const container = document.createElement("div");
        container.classList.add("field");
        const input = document.createElement("input");
        input.id = name;
        input.name = name;
        input.style.marginRight = "0.5rem";
        input.type = "checkbox";
        input.checked = value;
        const label = document.createElement("label");
        label.htmlFor = name;
        label.innerHTML = description;
        container.append(input, label);
        return container;
      };
      const addSettings = () => {
        const container = document.querySelector(".container");
        const separator = document.createElement("hr");
        const title = document.createElement("h4");
        title.classList.add("title", "is-4");
        title.innerHTML = "Script settings";
        const form = document.createElement("form");
        form.onsubmit = () => {
          const formData = new FormData(form);
          const formProps = Object.fromEntries(formData);
          localStorage.setItem("skip_download", formProps["skip_download"] ? "true" : "false");
          localStorage.setItem("strip_filter", formProps["strip_filter"] ? "true" : "false");
          location.reload();
        };
        const skipDownload = localStorage.getItem("skip_download");
        const stripFilter = localStorage.getItem("strip_filter");
        const skipDownloadCheckbox = buildCheckboxField({
          name: "skip_download",
          description: "Skip downloaded galleries from batch downloads.",
          value: skipDownload === "true"
        });
        const stripFilterCheckbox = buildCheckboxField({
          name: "strip_filter",
          description: "Avoid striping '?filter=null' from the image URL. Enable this if downloads fail or are incomplete.",
          value: stripFilter === "true"
        });
        form.append(skipDownloadCheckbox, stripFilterCheckbox);
        const submitButton = document.createElement("div");
        submitButton.classList.add("filter");
        submitButton.innerHTML = '<div class="control"><button class="button is-primary">Submit</button></div>';
        form.append(submitButton);
        const columns = document.createElement("div");
        columns.classList.add("columns");
        const column = document.createElement("div");
        column.classList.add("column");
        column.append(form);
        columns.append(column);
        container.append(separator);
        container.append(title);
        container.append(columns);
      };
      const init = exports("init", () => {
        addSettings();
      });

    })
  };
}));

System.import("./__entry.js", "./");function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
