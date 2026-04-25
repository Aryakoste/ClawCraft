import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  icon?: ReactNode
}

export default function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center text-claw-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
