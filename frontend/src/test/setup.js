import '@testing-library/jest-dom/vitest';
import { createRequire } from 'node:module';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

window.SunThreadGeocoding=createRequire(import.meta.url)('../../static/js/geocoding.js');
window.matchMedia=vi.fn().mockImplementation(query=>({matches:false,media:query,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true;}}));
globalThis.ResizeObserver=class {observe(){} disconnect(){} unobserve(){}};
afterEach(()=>cleanup());
