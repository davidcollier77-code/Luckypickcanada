# Three.js — Development Reference

**Official upstream source:** https://threejs.org/docs/llms-full.txt  
**Official API reference:** https://threejs.org/docs/  
**Official manual:** https://threejs.org/manual/  
**TSL guide:** https://threejs.org/tsl/

This library entry supports creation and refinement of Three.js experiences in Lucky Pick Canada. The PR installs Three.js 0.187.0. Check examples and APIs against that installed version rather than assuming the upstream documentation always matches the project dependency.

## Practical coverage

- Scene graphs, cameras, meshes, geometry, materials, lighting, shadows and textures.
- Animation mixers, keyframe tracks and scene transitions.
- GLTF/GLB model loading and asset lifecycle.
- WebGL rendering, render targets, post-processing and addon passes.
- Shader development, TSL, and WebGPU concepts for technical reference.

## Project constraints

Use the existing `app/lib/graphics/` entry points and the repository's capability, adaptive-performance and resource-readiness systems. Preserve lazy loading, mobile quality budgets, reduced-motion behaviour, context recovery and deterministic disposal. WebGL remains the supported rendering path; WebGPU is reference-only unless separately authorized. Do not add duplicate renderers, preloaders or dependencies when existing project capabilities already cover the need.

## Upstream documentation

The full official reference is the canonical source configured for automatic refresh. The existing documentation updater will replace this bootstrap guide with the upstream snapshot and maintain the shared entry across the `creation` and `polishing` groups on its next successful run.
