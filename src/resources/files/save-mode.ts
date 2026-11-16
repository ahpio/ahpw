import type { BindingPath } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';

/** How a file saves after Edit: `live`, each edit to everyone at once, or `manual`, on Save. Changed per file on its page. */
export const FILE_SAVE_MODE = chatChoice('$/ahp/files/saveMode' as BindingPath, 'ahpw.fileSaveMode', ['live', 'manual'], 'live');
