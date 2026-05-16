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
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-4 rounded-[1.75rem] border border-neutral-200 bg-white/80 p-3 shadow-sm">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-200 ${
              item.active
                ? "bg-black text-white shadow-lg"
                : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 hover:shadow-sm"
            }`}
          >
            {item.title}
          </a>
        ))}
      </div>
    </div>
  )
}
