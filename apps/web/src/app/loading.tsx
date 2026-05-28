export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[pulse_0.9s_ease-in-out_infinite] rounded-r-full bg-[#111827]" />
    </div>
  )
}
