export function MarekLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`bg-card rounded-full flex items-center justify-center ${className}`}>
        <div className="w-3 h-3 bg-primary rounded-full"></div>
      </div>
      <span className="font-bold text-xl text-foreground tracking-wide">MAREK HEALTH</span>
    </div>
  )
}