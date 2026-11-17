'use client';

import { useEffect, useRef } from 'react';
import { monaco } from '@/lib/monaco-setup';

// A plain React wrapper around Monaco Editor, in place of the
// @monaco-editor/react package: create the editor when the component
// mounts, report changes, and clean it up when it unmounts.
//
// `value` is only the starting text. After that the editor owns the text and
// reports every change through onChange. ConfigEditor gives each file its
// own key, so opening another file creates a fresh editor.
//
// Browser only: ConfigEditor loads this with next/dynamic and ssr: false.
interface Props {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, language, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: 'vs-dark',
      automaticLayout: true, // follow the panel's size
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 16, bottom: 16 },
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    });
    const subscription = editor.onDidChangeModelContent(() => {
      onChangeRef.current(editor.getValue());
    });

    return () => {
      subscription.dispose();
      editor.getModel()?.dispose();
      editor.dispose();
    };
    // Created once per mount on purpose: see the note on `value` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
