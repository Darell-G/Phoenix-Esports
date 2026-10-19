import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
const output = path.resolve(".responsive-qa");
await mkdir(output, { recursive: true });
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=9237",
    `--user-data-dir=${path.join(tmpdir(), "phoenix-responsive-chrome")}`,
    "--disable-extensions",
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      target = await (
        await fetch("http://127.0.0.1:9237/json/new?about:blank", {
          method: "PUT",
        })
      ).json();
      break;
    } catch {
      await pause(300);
    }
  }
  assert(target?.webSocketDebuggerUrl, "Headless Chrome must start");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      message.error
        ? reject(new Error(JSON.stringify(message.error)))
        : resolve(message.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`Timed out: ${method}`));
      }, 30000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send("Page.enable");
  const results = [];
  const routes = [
    "/",
    "/announcements",
    "/events",
    "/recruitment",
    "/tournaments",
    "/merch",
    "/tournaments/tournament-0",
    "/announcements/announcement-0",
    "/merch/product-0",
    "/recruitment/opening-0",
    "/portal",
    "/portal/members",
    "/portal/applications",
    "/portal/content",
    "/portal/openings",
    "/portal/tournaments",
    "/portal/settings",
    "/portal/audit",
    "/login",
  ];
  async function navigate(route, width, extra = "") {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width < 640 ? 844 : 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", {
      url: `http://127.0.0.1:5173/scripts/responsive-preview.html?route=${encodeURIComponent(route)}${extra}`,
    });
    for (let attempt = 0; attempt < 160; attempt++) {
      if (await evaluate("window.qaReady === true")) break;
      await pause(150);
    }
    assert(
      await evaluate("window.qaReady === true"),
      `Fixture ready: ${route}`,
    );
    await evaluate("document.fonts.ready.then(() => true)");
    await pause(250);
  }
  async function check(label, width) {
    const metrics = await evaluate(`(() => {
      const dialog = document.querySelector('dialog[open]');
      const root = document.documentElement;
      return { width: innerWidth, scrollWidth: root.scrollWidth, footerHeight: document.querySelector('footer')?.getBoundingClientRect().height, dialogWidth: dialog?.getBoundingClientRect().width,
        dialogOverflow: dialog ? dialog.scrollWidth > dialog.clientWidth + 1 : false,
        smallFields: [...document.querySelectorAll('.field')].filter(e => e.getBoundingClientRect().width > 0 && innerWidth < 640 && parseFloat(getComputedStyle(e).fontSize) < 16).length,
        error: document.querySelector('vite-error-overlay') !== null };
    })()`);
    results.push({ label, width, ...metrics });
    if (metrics.scrollWidth > metrics.width + 1) {
      await screenshot("overflow-" + label.replaceAll("/", "-"));
      console.log(
        await evaluate(
          `JSON.stringify([...document.querySelectorAll('body *')].filter(e => { if(e.getBoundingClientRect().right <= innerWidth + 1) return false; for(let p=e.parentElement;p;p=p.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right <= innerWidth+1) return false;} return true; }).slice(0,20).map(e => ({tag:e.tagName,classes:e.className,text:e.textContent.slice(0,80),width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})))`,
        ),
      );
    }
    assert(!metrics.error, `No Vite error: ${label}`);
    assert(
      metrics.scrollWidth <= metrics.width + 1,
      `Page overflow ${label} at ${width}: ${JSON.stringify(metrics)}`,
    );
    assert(!metrics.dialogOverflow, `Dialog overflow: ${label}`);
    assert.equal(metrics.smallFields, 0, `16px fields on phones: ${label}`);
  }
  async function screenshot(name) {
    await pause(250);
    await evaluate(
      `Promise.all([...document.images].filter(img => { const r = img.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).map(img => img.decode().catch(() => {})))`,
    );
    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      path.join(output, `${name}.png`),
      Buffer.from(data, "base64"),
    );
  }
  const checkedRoutes = process.argv[2] ? [process.argv[2]] : routes;
  for (const width of [320, 390, 768, 1440]) {
    for (const route of checkedRoutes) {
      await navigate(route, width);
      await check(route, width);
      if (process.argv.includes("--scoreboard")) {
        await evaluate(
          "document.querySelector('[aria-label=\"Tournament standings\"]').scrollIntoView({block:'center',behavior:'instant'})",
        );
        const colors = await evaluate(
          `(() => { const region = document.querySelector('[aria-label="Tournament standings"]'); const rows = region.querySelectorAll('tbody tr'); return { surface: getComputedStyle(region).backgroundColor, header: getComputedStyle(region.querySelector('thead')).backgroundColor, first: getComputedStyle(rows[0]).backgroundColor, second: getComputedStyle(rows[1]).backgroundColor }; })()`,
        );
        assert.equal(
          colors.surface,
          "rgb(255, 255, 255)",
          "White scoreboard surface",
        );
        assert.equal(colors.first, colors.surface, "White data rows");
        assert.notEqual(colors.second, colors.first, "Alternating grey rows");
        assert.notEqual(
          colors.header,
          colors.surface,
          "Grey scoreboard header",
        );
        await screenshot(`scoreboard-${width}`);
      }
      if (process.argv.includes("--footer")) {
        await evaluate(
          "document.querySelector('footer').scrollIntoView({behavior: 'instant'})",
        );
        await screenshot(`footer-${width}`);
      }
      if (route === "/recruitment/opening-0") {
        assert(
          await evaluate(
            `(() => { const summary = document.querySelector('[aria-label="Opening summary and requirements"]'); const card = document.querySelector('aside'); const link = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Apply via external form')); return !document.querySelector('form') && !!link && link.target === '_blank' && !!(summary.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING); })()`,
          ),
          "External opening application and summary above publication card",
        );
        if (width === 390) await screenshot("external-opening-390");
      }
      if (route === "/recruitment")
        assert(
          await evaluate("!document.querySelector('input[type=search]')"),
          "Recruitment search removed",
        );
      if (
        (route === "/login" || width === 390) &&
        [
          "/",
          "/login",
          "/tournaments/tournament-0",
          "/portal/members",
        ].includes(route)
      )
        await screenshot(`${route.replaceAll("/", "-") || "home"}-${width}`);
    }
    console.log(
      `PASS ${checkedRoutes.length} public/portal layouts at ${width}px`,
    );
  }
  for (const [route, text] of [
    ["/portal/members", "Add member"],
    ["/portal/content", "Create content"],
    ["/portal/tournaments", "Create tournament"],
  ]) {
    await navigate(route, 320);
    const clicked = await evaluate(
      `(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(text)})); button?.click(); return !!button; })()`,
    );
    assert(clicked, `Find dialog opener: ${text}`);
    await pause(200);
    assert(
      await evaluate("!!document.querySelector('dialog[open]')"),
      `Dialog opened: ${text}`,
    );
    await check(text, 320);
    await screenshot(`${text.replaceAll(" ", "-")}-320`);
    await evaluate("document.querySelector('dialog[open]').scrollTop = 10000");
    await check(`${text} bottom controls`, 320);
  }
  await navigate("/portal/tournaments", 320);
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Teams & matches')).click()",
  );
  await pause(250);
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Add match')).click()",
  );
  await pause(150);
  assert(
    await evaluate("!!document.querySelector('dialog[open]')"),
    "Match dialog opened",
  );
  await check("match editor", 320);
  await screenshot("match-editor-320");
  await navigate("/portal/members", 320, "&dark=1");
  assert(
    await evaluate(
      "document.querySelector('.portal-theme').classList.contains('dark')",
    ),
    "Dark theme fixture",
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Add member')).click()",
  );
  await pause(150);
  await check("dark member dialog", 320);
  await screenshot("dark-member-dialog-320");
  await navigate("/portal/tournaments", 844);
  await navigate("/portal/settings", 390);
  await evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Manage access')).click()",
  );
  await pause(100);
  await evaluate(
    `(() => { const field = document.querySelector('dialog input'); field.value = 'QA Updated Administrator'; field.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('dialog form').requestSubmit(); })()`,
  );
  await pause(250);
  assert(
    await evaluate(
      "!document.querySelector('dialog[open]') && document.querySelector('aside [role=group]').getAttribute('aria-label') === 'Signed in as QA Updated Administrator'",
    ),
    "Saved name closes access modal and updates sidebar",
  );
  await evaluate(
    "document.querySelector('[aria-controls=portal-navigation]').click()",
  );
  await pause(200);
  await check("saved administrator name", 390);
  await screenshot("updated-administrator-name-390");
  await navigate("/portal/tournaments", 844);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 844,
    height: 390,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await pause(150);
  await check("landscape portal", 844);
  await screenshot("landscape-portal-844");
  await navigate("/", 390);
  await evaluate(
    "document.querySelector('#community').scrollIntoView({behavior: 'instant'})",
  );
  await screenshot("community-images-390");
  await evaluate(
    "document.querySelector('footer').scrollIntoView({behavior: 'instant'})",
  );
  await screenshot("footer-390");
  await navigate("/", 320);
  assert(
    await evaluate(
      "document.querySelector('[aria-controls=mobile-nav] svg').getAttribute('width') === '16'",
    ),
    "Small hamburger icon",
  );
  await evaluate(
    "document.querySelector('[aria-controls=mobile-nav]').click()",
  );
  await pause(150);
  await check("mobile menu", 320);
  assert(
    await evaluate(
      "document.querySelector('[aria-controls=mobile-nav]').getAttribute('aria-label') === 'Close navigation'",
    ),
    "Accessible close icon",
  );
  await screenshot("mobile-navigation-icons-320");
  await navigate("/portal/tournaments", 320);
  await evaluate(
    "document.querySelector('[aria-controls=portal-navigation]').click()",
  );
  await pause(250);
  await check("expanded mobile sidebar", 320);
  await screenshot("sidebar-320");
  await navigate("/tournaments/tournament-0", 390, "&empty=1");
  await check("empty tournament", 390);
  await writeFile(
    path.join(
      output,
      process.argv[2] ? "focused-results.json" : "results.json",
    ),
    JSON.stringify(results, null, 2),
  );
  console.log(
    `PASS ${results.length} responsive checks; screenshots saved to .responsive-qa/`,
  );
} finally {
  socket?.close();
  chrome.kill();
}
