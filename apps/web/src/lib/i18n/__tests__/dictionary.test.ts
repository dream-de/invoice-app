import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { appTranslations, legacyDomTranslations } from "../../../i18n/dictionary"
import { DEFAULT_LANGUAGE, isAppLanguage, supportedLanguages } from "../../../i18n/config"

describe("i18n dictionary", () => {
  it("keeps all configured language namespaces aligned", () => {
    const deKeys = Object.keys(appTranslations.de).sort()

    for (const language of supportedLanguages) {
      const keys = Object.keys(appTranslations[language.code]).sort()
      assert.deepEqual(keys, deKeys)
    }
  })

  it("has no empty public translation values", () => {
    for (const language of supportedLanguages) {
      const dictionary = appTranslations[language.code]
      const emptyKeys = Object.entries(dictionary)
        .filter(([, value]) => typeof value !== "string" || value.trim() === "")
        .map(([key]) => key)

      assert.deepEqual(emptyKeys, [])
    }
  })

  it("does not reintroduce removed blank settings placeholder keys", () => {
    const removedPlaceholderKeys = [
      "settings.language.description",
      "settings.language.hint",
      "settings.backup.description"
    ]

    for (const language of supportedLanguages) {
      const dictionary = appTranslations[language.code]
      const presentRemovedKeys = removedPlaceholderKeys.filter((key) => key in dictionary)

      assert.deepEqual(presentRemovedKeys, [])
    }
  })

  it("keeps the configured languages stable", () => {
    assert.equal(DEFAULT_LANGUAGE, "de")
    assert.equal(isAppLanguage("de"), true)
    assert.equal(isAppLanguage("en"), true)
    assert.equal(isAppLanguage("fr"), true)
    assert.equal(isAppLanguage("es"), true)
    assert.equal(isAppLanguage("it"), true)
    assert.equal(isAppLanguage("nl"), true)
    assert.equal(isAppLanguage("pl"), true)
    assert.equal(isAppLanguage("pt"), true)
    assert.equal(isAppLanguage("tr"), true)
  })

  it("keeps legacy DOM translations isolated to English", () => {
    assert.ok(legacyDomTranslations.en)
    assert.equal(Object.keys(legacyDomTranslations).length, 1)
  })
})
