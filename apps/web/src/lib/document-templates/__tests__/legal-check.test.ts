import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_INVOICE_TEMPLATE } from "../constants";
import { checkTemplateLegalBasics } from "../legal-check";

describe("template legal check", () => {
  it("accepts the default invoice template", () => {
    const result = checkTemplateLegalBasics(DEFAULT_INVOICE_TEMPLATE);

    assert.deepEqual(result, { ok: true, missing: [] });
  });

  it("reports missing required building blocks", () => {
    const result = checkTemplateLegalBasics({
      id: "broken-template",
      name: "Broken Template",
      type: "invoice",
      page: { width: 600, height: 800 },
      elements: [
        {
          id: "title",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 40,
          content: "Rechnung",
        },
      ],
    });

    assert.deepEqual(result.missing, ["a4", "customer", "number", "date", "company", "items", "total", "payment"]);
  });
});
