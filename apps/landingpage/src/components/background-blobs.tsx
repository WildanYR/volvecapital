'use client'

export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-white">
      {/* Very subtle glow to give depth without interfering with text */}
      <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-orange-50/30 blur-[160px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-50 blur-[120px] rounded-full" />
    </div>
  )
}
