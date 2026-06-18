type SettingsTabItem = {
  title: string
  href: string
  active?: boolean
}

type SettingsTabsProps = {
  items: SettingsTabItem[]
}

export function SettingsTabs({ items }: SettingsTabsProps) {
  return (
    <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
      <div className="flex min-w-max items-center gap-1 rounded-lg border border-neutral-200 bg-white/80 p-1 shadow-sm">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-md border px-2 text-[11px] font-bold leading-none transition-colors duration-150 ${
              item.active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-transparent text-neutral-600 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950"
            }`}
          >
            {item.title}
          </a>
        ))}
      </div>
    </div>
  )
}
