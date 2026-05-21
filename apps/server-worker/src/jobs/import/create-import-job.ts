import type { ImportFileReference, ImportJobKind, ImportJobPriority, ImportProcessingJob } from "./types"

type CreateImportJobInput = {
  kind: ImportJobKind
  file: ImportFileReference
  requestedBy?: string
  priority?: ImportJobPriority
  locale?: string
  now?: Date
}

export function createImportProcessingJob(input: CreateImportJobInput): ImportProcessingJob {
  const now = input.now ?? new Date()

  return {
    id: `import-${input.kind}-${now.getTime()}`,
    kind: input.kind,
    file: input.file,
    requestedBy: input.requestedBy,
    priority: input.priority ?? "normal",
    locale: input.locale ?? "de-DE",
    createdAt: now.toISOString()
  }
}
