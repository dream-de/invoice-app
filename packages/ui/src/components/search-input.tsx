import { Input } from "./input"

type SearchInputProps = {
  placeholder?: string
}

export function SearchInput({
  placeholder = "Suchen..."
}: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      aria-label={placeholder}
    />
  )
}
