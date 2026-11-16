import type { BindingPath } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';

/** Whether a file opens with its comments in a margin, `shown`, or folded away, `hidden`. Changed per file with 💬 on its page. */
export const FILE_COMMENTS = chatChoice('$/ahp/files/comments' as BindingPath, 'ahpw.fileComments', ['hidden', 'shown'], 'hidden');
