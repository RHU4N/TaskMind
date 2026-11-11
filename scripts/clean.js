import { rm } from 'node:fs/promises';

// Only build artefacts belong to this command; source and server files are never targets.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
