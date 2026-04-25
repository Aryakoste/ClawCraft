import Editor from '@monaco-editor/react'

interface SkillEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  height?: string
}

export default function SkillEditor({
  value,
  onChange,
  readOnly = false,
  height = '100%',
}: SkillEditorProps) {
  return (
    <div className="monaco-container h-full">
      <Editor
        height={height}
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={v => onChange?.(v ?? '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'gutter',
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          fontLigatures: true,
          tabSize: 2,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  )
}
