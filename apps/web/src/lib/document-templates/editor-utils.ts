import type { DocumentElement, DocumentTemplate } from "./types";

export type TableConfig = {
  col1: number;
  col2: number;
  col3: number;
};

type TemplateSavePayloadOptions = {
  templateId: string;
  templateName: string;
  template: DocumentTemplate;
  asCopy?: boolean;
  nameOverride?: string;
};

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  col1: 140,
  col2: 140,
  col3: 140,
};

export const TEMPLATE_CANVAS_WIDTH = 794;
export const TEMPLATE_ZOOM_STEP = 0.1;
export const TEMPLATE_AUTO_SCALE_MIN = 0.58;
export const TEMPLATE_AUTO_SCALE_MAX = 1.22;
export const TEMPLATE_MANUAL_SCALE_MAX = 1.7;
export const TEMPLATE_NEW_SCALE_MIN = 0.5;
export const TEMPLATE_NEW_SCALE_MAX = 1.6;

export function createEditorId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function calculateTemplateAutoScale(viewportWidth: number) {
  const leftWidth = viewportWidth >= 1400 ? 350 : 292;
  const rightWidth = viewportWidth >= 1400 ? 370 : 320;
  const available = viewportWidth - leftWidth - rightWidth - 96;
  const nextScale = Math.max(TEMPLATE_AUTO_SCALE_MIN, Math.min(TEMPLATE_AUTO_SCALE_MAX, available / TEMPLATE_CANVAS_WIDTH));
  return Number(nextScale.toFixed(2));
}

export function decreaseTemplateScale(scale: number, min = TEMPLATE_AUTO_SCALE_MIN) {
  return Math.max(min, Number((scale - TEMPLATE_ZOOM_STEP).toFixed(2)));
}

export function increaseTemplateScale(scale: number, max = TEMPLATE_MANUAL_SCALE_MAX) {
  return Math.min(max, Number((scale + TEMPLATE_ZOOM_STEP).toFixed(2)));
}

export function createTemplateElement(type: DocumentElement["type"], getContent: (type: DocumentElement["type"]) => string): DocumentElement {
  return {
    id: createEditorId(type),
    type,
    x: 80,
    y: 80,
    width: type === "line" ? 240 : type === "table" ? 420 : type === "paymentQr" ? 96 : 180,
    height: type === "line" ? 1 : type === "table" ? 140 : type === "paymentQr" ? 96 : 40,
    content: getContent(type),
    fontSize: 14,
    fontWeight: "normal",
    color: "#111111",
    backgroundColor: type === "box" ? "#f8fafc" : type === "paymentQr" ? "" : "transparent",
    align: "left",
    fontFamily: "Inter, system-ui, sans-serif",
  };
}

export function duplicateTemplateElements(elements: DocumentElement[], ids: string[], offset = 12) {
  const picked = elements.filter((element) => ids.includes(element.id));
  return picked.map((element) => ({
    ...element,
    id: createEditorId(element.type),
    x: element.x + offset,
    y: element.y + offset,
  }));
}

export function cloneTemplateElement(element: DocumentElement, offset = 14) {
  return {
    ...element,
    id: createEditorId(element.type),
    x: element.x + offset,
    y: element.y + offset,
  };
}

export function removeTemplateElements(template: DocumentTemplate, ids: string[]) {
  return {
    ...template,
    elements: template.elements.filter((element) => !ids.includes(element.id)),
  };
}

export function removeTemplateElement(template: DocumentTemplate, id: string) {
  return removeTemplateElements(template, [id]);
}

export function moveTemplateLayerTo(elements: DocumentElement[], fromId: string, toId: string) {
  if (fromId === toId) return elements;

  const list = [...elements];
  const from = list.findIndex((element) => element.id === fromId);
  const to = list.findIndex((element) => element.id === toId);

  if (from < 0 || to < 0) return elements;

  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return list;
}

export function moveTemplateLayer(elements: DocumentElement[], id: string, direction: "up" | "down") {
  const index = elements.findIndex((element) => element.id === id);
  if (index < 0) return elements;

  const target = direction === "up" ? index + 1 : index - 1;
  if (target < 0 || target >= elements.length) return elements;

  const list = [...elements];
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  return list;
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function getTemplateElementForClipboard(elements: DocumentElement[], selectedId: string | undefined, selectedIds: string[]) {
  const pickId = selectedId ?? selectedIds[0];
  if (!pickId) return undefined;
  return elements.find((element) => element.id === pickId);
}

export function moveTemplateElementWithKeyboard(
  element: DocumentElement,
  key: string,
  step: number,
  snap: (value: number) => number
) {
  let x = element.x;
  let y = element.y;

  if (key === "ArrowUp") y -= step;
  if (key === "ArrowDown") y += step;
  if (key === "ArrowLeft") x -= step;
  if (key === "ArrowRight") x += step;

  return { x: snap(x), y: snap(y) };
}

export function createTemplateSavePayload(options: TemplateSavePayloadOptions) {
  const nextName = options.nameOverride ?? options.templateName;
  const nextId = options.asCopy ? `tpl-${Date.now()}` : options.templateId;

  return {
    id: nextId,
    name: nextName,
    type: "invoice",
    active: !options.asCopy,
    data: { ...options.template, id: nextId, name: nextName },
  };
}
