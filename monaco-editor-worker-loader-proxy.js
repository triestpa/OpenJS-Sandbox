 // This tiny webworker is required to load Monaco cross-domain
 // See https://github.com/Microsoft/monaco-editor for an explanation

self.MonacoEnvironment = {
  baseUrl: 'https://cdn.patricktriest.com/vendor/monaco/'
};

importScripts('https://cdn.patricktriest.com/vendor/monaco/vs/base/worker/workerMain.js');
