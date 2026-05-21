const content = {
  "productName": "Dream Invoice",
  "eyebrow": "Digital Billing Workspace",
  "headline": "Billing, documents and finance in one calm workspace.",
  "subline": "Dream Invoice brings invoices, templates, customers, articles, finance imports and PDF downloads into one focused web app for daily business work.",
  "primaryCta": "Open public demo",
  "secondaryCta": "Open app",
  "demoUrl": "https://demo.dream-invoice.com",
  "appUrl": "https://app.dream-invoice.com",
  "metrics": [
    {
      "label": "Workspaces",
      "value": "8+"
    },
    {
      "label": "Exports",
      "value": "PDF / CSV"
    },
    {
      "label": "Languages",
      "value": "DE / EN"
    }
  ],
  "screenshots": [
    {
      "title": "Dashboard",
      "description": "Quick actions, metrics and notifications at the start of the workflow.",
      "src": "./assets/screenshots/dashboard.png"
    },
    {
      "title": "Documents",
      "description": "Invoices, document status, export actions and clean selection flows.",
      "src": "./assets/screenshots/documents.png"
    },
    {
      "title": "Template editor",
      "description": "A4 templates with properties, layers, live editing and preview controls.",
      "src": "./assets/screenshots/template-editor.png"
    }
  ],
  "features": [
    {
      "title": "Documents without friction",
      "description": "Invoices, offers and templates stay in one workspace with live previews and PDF output."
    },
    {
      "title": "Reusable business data",
      "description": "Customers, projects, articles, number ranges and language settings are prepared once and reused everywhere."
    },
    {
      "title": "Import and export foundation",
      "description": "CSV imports, finance account import, document export and browser-safe downloads are built as app primitives."
    }
  ],
  "workflow": [
    {
      "title": "Prepare",
      "description": "Set company data, customers, articles, number ranges and language."
    },
    {
      "title": "Create",
      "description": "Edit documents with live preview and export them as polished PDF files."
    },
    {
      "title": "Automate",
      "description": "Server worker foundation for reminders, recurring invoices and scheduled maintenance."
    }
  ],
  "productPaths": [
    {
      "label": "Website",
      "title": "Public product page",
      "description": "Clear overview, screenshots, feature story and route to the demo.",
      "url": "https://dream-invoice.com",
      "status": "Landing"
    },
    {
      "label": "Demo",
      "title": "Safe public workspace",
      "description": "Fictional records, guided workflows and reset-safe interactions.",
      "url": "https://demo.dream-invoice.com",
      "status": "Public demo"
    },
    {
      "label": "App",
      "title": "Production workspace",
      "description": "The private billing app for real customers, documents and exports.",
      "url": "https://app.dream-invoice.com",
      "status": "Product app"
    },
    {
      "label": "Desktop",
      "title": "Future native shell",
      "description": "Prepared Electron foundation for local desktop workflows later.",
      "url": "desktop-ready",
      "status": "Foundation"
    }
  ],
  "readiness": [
    "Fictional demo data only",
    "Separated demo and app domains",
    "Browser-safe PDF and CSV download story",
    "Desktop foundation can grow without changing the web app"
  ],
  "audience": [
    "Freelancers and small teams",
    "Agencies and service providers",
    "Product and goods invoices"
  ],
  "roadmap": [
    "Public demo with fictional data",
    "Separated app, demo and landing domains",
    "Desktop foundation prepared later without breaking the web app"
  ]
};

const root = document.getElementById("landing-root");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function featureCard(item) {
  return `
    <article class="feature-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `;
}

function metricPill(item) {
  return `
    <div class="metric-pill">
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>
  `;
}

function listItem(item) {
  return `<li>${escapeHtml(item)}</li>`;
}

function pathCard(item) {
  const href = item.url.startsWith("https://") ? item.url : "#desktop";
  return `
    <a class="path-card" href="${escapeHtml(href)}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.description)}</p>
      <em>${escapeHtml(item.status)}</em>
    </a>
  `;
}

function screenshotCard(item) {
  return `
    <article class="screenshot-card">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)} screenshot" loading="lazy" />
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </article>
  `;
}

root.innerHTML = `
  <section class="shell">
    <header class="site-header">
      <a class="brand" href="/" aria-label="${escapeHtml(content.productName)}">
        <span class="brand-mark" aria-hidden="true">DI</span>
        <span>${escapeHtml(content.productName)}</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#features">Features</a>
        <a href="#screens">Screens</a>
        <a href="#workflow">Workflow</a>
        <a href="${escapeHtml(content.demoUrl)}">Demo</a>
      </nav>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(content.eyebrow)}</p>
        <h1>${escapeHtml(content.headline)}</h1>
        <p class="subline">${escapeHtml(content.subline)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="${escapeHtml(content.demoUrl)}">${escapeHtml(content.primaryCta)}</a>
          <a class="button button-secondary" href="${escapeHtml(content.appUrl)}">${escapeHtml(content.secondaryCta)}</a>
        </div>
        <div class="metrics">
          ${content.metrics.map(metricPill).join("")}
        </div>
      </div>

      <figure class="product-preview" aria-label="Dream Invoice dashboard preview">
        <img src="${escapeHtml(content.screenshots[0].src)}" alt="Dream Invoice dashboard" />
      </figure>
    </section>
  </section>

  <section id="features" class="content-band">
    <div class="section-heading section-heading-split">
      <div>
        <p class="eyebrow">Product</p>
        <h2>Built for real billing work, not for a marketing shell.</h2>
      </div>
      <p>
        The landing page intentionally shows the real product areas: dashboard, documents,
        templates, imports and the public demo route.
      </p>
    </div>
    <div class="feature-grid">
      ${content.features.map(featureCard).join("")}
    </div>
  </section>

  <section id="screens" class="screenshot-band">
    <div class="section-heading section-heading-split">
      <div>
        <p class="eyebrow">Screens</p>
        <h2>The important areas at a glance.</h2>
      </div>
      <p>
        The public demo is separated from the app domain and uses fictional sample data only.
      </p>
    </div>
    <div class="screenshot-grid">
      ${content.screenshots.slice(1).map(screenshotCard).join("")}
    </div>
  </section>

  <section id="workflow" class="content-band content-band-muted">
    <div class="section-heading">
      <p class="eyebrow">Workflow</p>
      <h2>From first contact to finished PDF.</h2>
    </div>
    <div class="feature-grid workflow-grid">
      ${content.workflow.map(featureCard).join("")}
    </div>
  </section>

  <section class="content-band proof-band">
    <article class="proof-card">
      <div>
        <p class="eyebrow">Public readiness</p>
        <h2>Demo, app and landing page are separated from the beginning.</h2>
        <p>
          The demo can later run on demo.dream-invoice.com with fictional data, while the app
          remains the private product workspace.
        </p>
        <ul class="readiness-list">${content.readiness.map(listItem).join("")}</ul>
      </div>
      <div class="domain-grid">
        <div><span>Website</span><strong>dream-invoice.com</strong></div>
        <div><span>Demo</span><strong>demo.dream-invoice.com</strong></div>
        <div><span>App</span><strong>app.dream-invoice.com</strong></div>
      </div>
    </article>
  </section>

  <section id="desktop" class="content-band paths-band">
    <div class="section-heading section-heading-split">
      <div>
        <p class="eyebrow">Product paths</p>
        <h2>One brand, separated surfaces.</h2>
      </div>
      <p>
        The repository can grow in public without mixing demo, production web app,
        landing page and desktop foundation.
      </p>
    </div>
    <div class="path-grid">
      ${content.productPaths.map(pathCard).join("")}
    </div>
  </section>

  <section class="content-band decision-band">
    <article class="decision-card">
      <div>
        <p class="eyebrow">Focus</p>
        <h2>One product core that can grow without breaking structure.</h2>
        <p>
          Stabilize web app, demo and landing first. Desktop, worker automation and additional
          languages can grow from that foundation later.
        </p>
      </div>
      <div class="decision-lists">
        <div>
          <h3>Built for</h3>
          <ul>${content.audience.map(listItem).join("")}</ul>
        </div>
        <div>
          <h3>Next expansion</h3>
          <ul>${content.roadmap.map(listItem).join("")}</ul>
        </div>
      </div>
    </article>
  </section>

  <footer class="site-footer">
    <span>${escapeHtml(content.productName)}</span>
    <span>dream-invoice.com</span>
    <span>demo.dream-invoice.com</span>
  </footer>
`;
