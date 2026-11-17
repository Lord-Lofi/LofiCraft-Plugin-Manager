// Sets up Monaco Editor, bundled with the app instead of loaded from a CDN.
//
// Monaco comes straight from the monaco-editor npm package; there is no
// wrapper library in between. No third-party code runs in the panel, the
// editor works offline, and Monaco's own dependencies (such as DOMPurify)
// are covered by package-lock.json, npm audit and Dependabot.
//
// Only loaded in the browser, through CodeEditor's dynamic import.
import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/register.all';
// Languages used for plugin configs (see detectLanguage in ConfigEditor)
import 'monaco-editor/languages/definitions/yaml/register';
import 'monaco-editor/languages/definitions/ini/register';
import 'monaco-editor/language/json/monaco.contribution';

// Monaco runs parsing work in background workers. The bundler emits each
// worker as its own file.
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new Worker(
        new URL('monaco-editor/language/json/json.worker', import.meta.url),
        { type: 'module' }
      );
    }
    return new Worker(
      new URL('monaco-editor/editor/editor.worker', import.meta.url),
      { type: 'module' }
    );
  },
};

export { monaco };
