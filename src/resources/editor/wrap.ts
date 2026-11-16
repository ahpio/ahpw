import type { BindingPath } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';

/** Whether a code editor wraps long lines when it opens: `off` keeps each line on one row, `on` wraps it. Toggled per editor with ↵ or Alt+Z. */
export const TEXT_WRAP = chatChoice('$/ahp/editor/wrap' as BindingPath, 'ahpw.textWrap', ['off', 'on'], 'off');
