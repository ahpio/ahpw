import { expect, test } from 'vitest';
import { base64Of, bytesOf, copyNameOf, entryActions, folderUriOf, leafOf, nameProblem, parentOf, relativePathOf, rootOf, siblingUri } from './menu.js';
import { withFolder, withoutFolder } from './added.js';

test('a folder offers to add, then to read and change, Delete last', () => {
  expect(entryActions({ host: 'h', uri: 'file:///src/a', directory: true, added: false, root: false, rootUri: 'file:///src' })).toEqual(['newFile', 'newFolder', 'upload', 'copyName', 'copyPath', 'copyRelativePath', 'rename', 'copy', 'delete']);
});

test('a file offers Download and nothing that adds', () => {
  expect(entryActions({ host: 'h', uri: 'file:///src/a.ts', directory: false, added: false, root: false, rootUri: 'file:///src' })).toEqual(['copyName', 'copyPath', 'copyRelativePath', 'download', 'rename', 'copy', 'delete']);
});

test('an added root offers Remove folder, and no root offers Copy relative path, Rename, Copy or Delete', () => {
  expect(entryActions({ host: 'h', uri: 'file:///opt/x', directory: true, added: true, root: true, rootUri: 'file:///opt/x' })).toEqual(['newFile', 'newFolder', 'upload', 'copyName', 'copyPath', 'removeFolder']);
  expect(entryActions({ host: 'h', uri: 'file:///w', directory: true, added: false, root: true, rootUri: 'file:///w' })).toEqual(['newFile', 'newFolder', 'upload', 'copyName', 'copyPath']);
});

test('a row counts its relative path from the deepest root it is under', () => {
  const roots = ['file:///w', 'file:///w/packages/sdk', 'file:///'];
  expect(rootOf('file:///w/src/a.ts', roots)).toBe('file:///w');
  expect(rootOf('file:///w/packages/sdk/src', roots)).toBe('file:///w/packages/sdk');
  expect(rootOf('file:///etc/hosts', roots)).toBe('file:///');
  expect(rootOf('file:///wx/a', ['file:///w'])).toBe('file:///wx/a');
  expect(relativePathOf('file:///w/src/my%20a.ts', 'file:///w')).toBe('src/my a.ts');
  expect(relativePathOf('file:///w/src/', 'file:///w/')).toBe('src');
  expect(relativePathOf('file:///etc/hosts', 'file:///')).toBe('etc/hosts');
});

test('a row that is no file or folder offers nothing', () => {
  expect(entryActions(null)).toEqual([]);
  expect(entryActions(undefined)).toEqual([]);
});

test('a URI splits into its folder and its decoded name', () => {
  expect(leafOf('file:///src/my%20file.ts')).toBe('my file.ts');
  expect(leafOf('file:///src/a/')).toBe('a');
  expect(parentOf('file:///src/a/b.ts')).toBe('file:///src/a');
  expect(parentOf('file:///etc')).toBe('file:///');
  expect(siblingUri('file:///src/a.ts', ' b c.ts ')).toBe('file:///src/b%20c.ts');
});

test('a name is one segment that is not a dot', () => {
  expect(nameProblem('a.ts')).toBeNull();
  expect(nameProblem('  ')).toBe('Enter a name.');
  expect(nameProblem('a/b')).toBe("Names can't contain a slash.");
  expect(nameProblem('a\\b')).toBe("Names can't contain a slash.");
  expect(nameProblem('..')).toBe('Enter a name other than a dot.');
});

test('a copy keeps its extension', () => {
  expect(copyNameOf('a.test.ts')).toBe('a.test copy.ts');
  expect(copyNameOf('Makefile')).toBe('Makefile copy');
  expect(copyNameOf('.env')).toBe('.env copy');
});

test('a path or a URI names a folder, and anything else does not', () => {
  expect(folderUriOf(' /home/me/my src/ ')).toBe('file:///home/me/my%20src');
  expect(folderUriOf('file:///opt/x/')).toBe('file:///opt/x');
  expect(folderUriOf('C:/Users/me/src/')).toBe('file:///C:/Users/me/src');
  expect(folderUriOf('C:/')).toBe('file:///C:/');
  expect(folderUriOf('/')).toBe('file:///');
  expect(folderUriOf('src')).toBeNull();
  expect(folderUriOf('')).toBeNull();
});

test('bytes go to base64 and back', () => {
  const bytes = new Uint8Array(70_000).map((_, at) => at % 256);
  expect(Array.from(bytesOf(base64Of(bytes)))).toEqual(Array.from(bytes));
  expect(base64Of(new TextEncoder().encode('hi'))).toBe('aGk=');
});

test('an added folder is kept once, and removed by any spelling', () => {
  expect(withFolder(['file:///a'], 'file:///a/')).toEqual(['file:///a']);
  expect(withFolder(['file:///a'], 'file:///b/')).toEqual(['file:///a', 'file:///b']);
  expect(withoutFolder(['file:///a', 'file:///b'], 'file:///a/')).toEqual(['file:///b']);
});
