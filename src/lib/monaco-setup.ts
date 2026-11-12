// Bundles Monaco Editor with the app instead of loading it from a CDN.
//
// By default @monaco-editor/react downloads Monaco from cdn.jsdelivr.net in
// the browser. Bundling the npm copy means no third-party code runs in the
// panel, the editor works offline, and Monaco's own dependencies (such as
// DOMPurify) are covered by package-lock.json, npm audit and Dependabot.
//
// Only loaded in the browser, by ConfigEditor's dynamic import.
import { loader } from '@monaco-editor/react';
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

loader.config({ monaco });
