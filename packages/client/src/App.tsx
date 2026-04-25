import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  Wand2,
  FolderOpen,
  Shield,
  LayoutGrid,
  Bug,
  Settings,
  GitBranch,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import GeneratorPage from './pages/Generator'
import MySkillsPage from './pages/MySkills'
import ScannerPage from './pages/Scanner'
import TemplatesPage from './pages/Templates'
import DebuggerPage from './pages/Debugger'
import SettingsPage from './pages/Settings'
import ComposerPage from './pages/Composer'
import UsagePage from './pages/Usage'

const NAV_ITEMS = [
  { to: '/generate', icon: Wand2, label: 'Generator' },
  { to: '/skills', icon: FolderOpen, label: 'My Skills' },
  { to: '/scanner', icon: Shield, label: 'Scanner' },
  { to: '/templates', icon: LayoutGrid, label: 'Templates' },
  { to: '/debugger', icon: Bug, label: 'Debugger' },
  { to: '/composer', icon: GitBranch, label: 'Composer' },
  { to: '/usage', icon: BarChart3, label: 'Usage' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function ClawIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  )
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-zinc-950 border-r border-zinc-800 z-40
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 bg-gradient-to-br from-claw-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <div className="font-bold text-zinc-100 text-sm leading-none">Clawcraft</div>
            <div className="text-zinc-500 text-xs mt-0.5">Skill Studio</div>
          </div>
          <button
            className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-100"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
              onClick={onClose}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-600">v1.0.0 · Free & Open Source</div>
        </div>
      </aside>
    </>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <button
              className="text-zinc-400 hover:text-zinc-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="font-semibold text-zinc-100 text-sm">Clawcraft</div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/generate" replace />} />
              <Route path="/generate" element={<GeneratorPage />} />
              <Route path="/skills" element={<MySkillsPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/debugger" element={<DebuggerPage />} />
              <Route path="/composer" element={<ComposerPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
