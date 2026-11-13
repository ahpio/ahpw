---
title: The form editors follow the schema
created: 2026-11-13
refs:
  - git://e2089d8 - the commit of ahpw the facts were checked at
  - git://forms/yaml-schema-hints - the branch with the yaml view's key and value hints
  - "[code://src/resources/editor/JsonCodeEditor.tsx](../../src/resources/editor/JsonCodeEditor.tsx) - the json view's editor, which marks only text that does not parse"
  - "[code://src/resources/editor/yamlView.tsx](../../src/resources/editor/yamlView.tsx) - the yaml view, which scena hands the form's schema"
  - npm://@softov/scena@0.6.2 - `JsonEditorProps` is `value` and `onChange` only, so the json editor never sees the schema
  - https://github.com/acao/codemirror-json-schema - completion, hover and schema lint for CodeMirror 6, in json, json5 and yaml, at 0.8.1
  - https://github.com/redhat-developer/yaml-language-server - the yaml schema support of Red Hat's YAML extension for VS Code, at 2.0.0
  - https://github.com/Microsoft/vscode-json-languageservice - the json schema support VS Code uses
---

# The form editors follow the schema

Softov wants the code views of a schema form to know the schema, beyond the yaml key and value hints. The json view gets the same hints, and both views say where the text breaks the schema.

## What others do

- VS Code completes, explains on hover and marks errors from a JSON Schema in json, through `vscode-json-languageservice`. Red Hat's YAML extension does the same in yaml, through `yaml-language-server`.
- `codemirror-json-schema` 0.8.1 does the same for CodeMirror 6, with exports for json, json5 and yaml. It depends on `json-schema-library`, `shiki` and `markdown-it`.

## What ahpw has today

- The yaml view completes the keys allowed at the cursor and a field's values, with each key's type, title and description. It is hand-written over `@codemirror/autocomplete`, on branch `forms/yaml-schema-hints`.
- The json view marks only text that does not parse. See [`code://src/resources/editor/JsonCodeEditor.tsx`](../../src/resources/editor/JsonCodeEditor.tsx).
- scena hands a form view its `schema`, and the json editor only `value` and `onChange`. Hints in the json view need scena to pass the schema to `jsonEditor` as well.
- Neither view marks an unknown key, a wrong type or a value outside an enum. The fields view does, through scena.
- At 390 px, CodeMirror's stock layout puts a key's description over the list below it.

## Who writes

`src/resources/editor/` is touched by branch `forms/yaml-schema-hints` only. The scena change is in Softov's scena repository.

## The change

- The json view completes keys and values from the schema, as the yaml view does.
- Both views mark where the text breaks the schema: an unknown key, a wrong type, a value outside an enum, a missing required key.
- Both views show a key's title and description on hover.
- A key's description does not cover the list at phone width.

## Open points

- Whether the hints and the lint stay hand-written, or come from `codemirror-json-schema` with its dependencies.
- Whether scena passes the schema to `jsonEditor`, or ahpw draws its own json view as it draws yaml.
- Whether a schema error stops Save and Create, as a parse error does, or only shows.
- How the description shows at phone width: under the list, on its own line, or not at all.
