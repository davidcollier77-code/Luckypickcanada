/**
 * Resource-readiness adapters for graphics and audio resources.
 *
 * The site-wide hub already prepares images, route bundles and audio. These
 * adapters add the three kinds a creative experience needs, using the hub's own
 * registered-adapter contract rather than a second preloader:
 *
 *   - `module` warms a heavy engine chunk (Three.js, GSAP, confetti, Howler)
 *     through `engine-chunks.js`, so the chunk is already in the browser cache
 *     when the effect starts. Nothing is executed.
 *   - `texture` fetches and decodes an image into an `ImageBitmap` a renderer can
 *     upload, with an explicit `dispose()`. It falls back to an `Image` where
 *     `createImageBitmap` is unavailable.
 *   - `model` preflights a glTF/GLB into the HTTP cache so the visible load is a
 *     cache hit. Parsing stays lazy: the feature loads it through
 *     `assets.js` when it actually needs the scene.
 *
 * Installing is idempotent and imports nothing heavy: the modules are loaded
 * only when a registered resource is prepared.
 */

import { READINESS, registerResourceAdapter } from '../resource-readiness.js';
import { loadEngineChunk } from './engine-chunks.js';

export const GRAPHICS_RESOURCE_KIND = Object.freeze({
  MODULE: 'module',
  TEXTURE: 'texture',
  MODEL: 'model',
});

let installed = false;

/**
 * Warms one engine chunk. The hub reports `fetched` when the network work has
 * finished and the resource is ready once the module is evaluated.
 *
 * @param {{ chunk?: string, label?: string }} resource
 * @param {{ report: (state: string) => void }} context
 */
export async function prepareModuleResource(resource, context) {
  if (typeof resource?.chunk !== 'string' || !resource.chunk) {
    throw new Error(`Module resource ${resource?.label ?? resource?.id ?? 'unknown'} has no chunk`);
  }
  context.report(READINESS.FETCHED);
  const module = await loadEngineChunk(resource.chunk);
  context.report(READINESS.INITIALIZED);
  return { chunk: resource.chunk, module };
}

/**
 * Fetches and decodes a texture.
 *
 * @param {{ url?: string }} resource
 * @param {{ report: (state: string) => void, signal?: AbortSignal }} context
 */
export async function prepareTextureResource(resource, context) {
  if (typeof resource?.url !== 'string' || !resource.url.trim()) {
    throw new Error('Texture resource needs a url');
  }
  if (typeof fetch !== 'function') {
    return { skipped: true, reason: 'fetch-unavailable' };
  }

  const response = await fetch(resource.url, {
    signal: context?.signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Texture failed to load: ${resource.url}`);
  context.report(READINESS.FETCHED);

  if (typeof createImageBitmap === 'function') {
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    context.report(READINESS.INITIALIZED);
    return {
      bitmap,
      dispose() {
        try {
          bitmap.close?.();
        } catch {
          // A closed bitmap is already released.
        }
      },
    };
  }

  // Fallback: keep the decoded HTMLImageElement; the renderer can upload it.
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const image = await new Promise((resolveImage, rejectImage) => {
      const element = new Image();
      element.onload = () => resolveImage(element);
      element.onerror = () => rejectImage(new Error(`Texture decode failed: ${resource.url}`));
      element.src = objectUrl;
    });
    context.report(READINESS.INITIALIZED);
    return {
      image,
      dispose() {
        image.src = '';
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/**
 * Preflights a glTF/GLB into the HTTP cache.
 *
 * @param {{ url?: string }} resource
 * @param {{ report: (state: string) => void, signal?: AbortSignal }} context
 */
export async function prepareModelResource(resource, context) {
  if (typeof resource?.url !== 'string' || !resource.url.trim()) {
    throw new Error('Model resource needs a url');
  }
  if (typeof fetch !== 'function') {
    return { skipped: true, reason: 'fetch-unavailable' };
  }

  const response = await fetch(resource.url, {
    signal: context?.signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Model failed to preflight: ${resource.url}`);
  context.report(READINESS.FETCHED);
  // Drain the body so the response is complete and the HTTP cache entry is
  // usable; the parsed scene is deliberately not kept here.
  const buffer = await response.arrayBuffer();
  context.report(READINESS.INITIALIZED);
  return { url: resource.url, bytes: buffer.byteLength };
}

/**
 * Registers the graphics adapters with the existing hub. Safe to call more than
 * once; the first call installs and later calls are no-ops.
 *
 * @returns {() => void} Restores the previous adapters (tests and hot reload).
 */
export function installGraphicsResourceAdapters() {
  if (installed) return () => {};
  installed = true;
  const restores = [
    registerResourceAdapter(GRAPHICS_RESOURCE_KIND.MODULE, prepareModuleResource),
    registerResourceAdapter(GRAPHICS_RESOURCE_KIND.TEXTURE, prepareTextureResource),
    registerResourceAdapter(GRAPHICS_RESOURCE_KIND.MODEL, prepareModelResource),
  ];
  return () => {
    installed = false;
    for (const restore of restores) {
      try {
        restore();
      } catch {
        // Restoring is a test/reload convenience, never a requirement.
      }
    }
  };
}
