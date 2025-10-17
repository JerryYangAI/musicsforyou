import { zh } from './zh';
import { en } from './en';

export const locales = {
  zh,
  en,
} as const;

export type Locale = keyof typeof locales;

export { zh, en };
