"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useLanguage, type AppLanguage } from "@/lib/i18n"
import { legacyDomTranslations } from "@/i18n/dictionary"

const exactTranslations: Record<string, string> = legacyDomTranslations.en.exact
const placeholderTranslations: Record<string, string> = legacyDomTranslations.en.placeholders
const embeddedTranslations: Record<string, string> = legacyDomTranslations.en.embedded

const reverseEmbeddedTranslations = Object.fromEntries(
  Object.entries(embeddedTranslations).map(([german, english]) => [english, german])
)

const reverseTranslations = Object.fromEntries(
  Object.entries(exactTranslations).map(([german, english]) => [english, german])
)

const reversePlaceholderTranslations = Object.fromEntries(
  Object.entries(placeholderTranslations).map(([german, english]) => [english, german])
)

function preserveSpacing(value: string, replacement: string) {
  const leading = value.match(/^\s*/)?.[0] ?? ""
  const trailing = value.match(/\s*$/)?.[0] ?? ""
  return `${leading}${replacement}${trailing}`
}

function shouldSkipTextElement(element: Element | null) {
  if (!element) return true

  return Boolean(
    element.closest("script, style, input, textarea, [contenteditable='true'], [data-no-translate], .invoice-a4-page")
  )
}

function shouldSkipAttributeElement(element: Element | null) {
  if (!element) return true

  return Boolean(
    element.closest("script, style, [contenteditable='true'], [data-no-translate], .invoice-a4-page")
  )
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function translateTextValue(value: string, language: "de" | "en") {
  const trimmed = value.trim()
  if (!trimmed) return value

  const dictionary = language === "en" ? exactTranslations : reverseTranslations
  const replacement = dictionary[trimmed] ?? dictionary[normalizeText(trimmed)]

  if (replacement) return preserveSpacing(value, replacement)

  const normalized = normalizeText(trimmed)
  const fuzzyEntry = Object.entries(dictionary).find(([source]) => normalizeText(source) === normalized)

  if (fuzzyEntry) return preserveSpacing(value, fuzzyEntry[1])

  const embeddedDictionary = language === "en" ? embeddedTranslations : reverseEmbeddedTranslations
  let nextValue = value

  Object.entries(embeddedDictionary).forEach(([source, target]) => {
    nextValue = nextValue.split(source).join(target)
  })

  return nextValue !== value ? nextValue : value
}

function translateAttributeValue(value: string, language: "de" | "en") {
  const trimmed = value.trim()
  if (!trimmed) return value

  const dictionary = language === "en" ? placeholderTranslations : reversePlaceholderTranslations
  const exactDictionary = language === "en" ? exactTranslations : reverseTranslations
  return dictionary[trimmed] ?? exactDictionary[trimmed] ?? value
}

function legacyBridgeLanguage(language: AppLanguage): "de" | "en" {
  return language === "de" ? "de" : "en"
}

function translatePage(language: "de" | "en") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (shouldSkipTextElement(node.parentElement)) continue
    textNodes.push(node)
  }

  textNodes.forEach((node) => {
    const nextValue = translateTextValue(node.nodeValue ?? "", language)
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue
  })

  document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
    if (shouldSkipAttributeElement(element)) return

    ;["placeholder", "aria-label", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value) return

      const nextValue = translateAttributeValue(value, language)
      if (nextValue !== value) element.setAttribute(attribute, nextValue)
    })
  })
}

export function PageTranslationBridge() {
  const pathname = usePathname()
  const { language } = useLanguage()

  useEffect(() => {
    let frame = 0

    function scheduleTranslate() {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => translatePage(legacyBridgeLanguage(language)))
    }

    scheduleTranslate()
    const timers = [
      window.setTimeout(scheduleTranslate, 60),
      window.setTimeout(scheduleTranslate, 240),
      window.setTimeout(scheduleTranslate, 600)
    ]

    const observer = new MutationObserver(scheduleTranslate)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"]
    })

    window.addEventListener("popstate", scheduleTranslate)

    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      observer.disconnect()
      window.removeEventListener("popstate", scheduleTranslate)
    }
  }, [language, pathname])

  return null
}
