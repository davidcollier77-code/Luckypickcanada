# Plan
1. Use sharp to process `public/images/file_00000000d12881f68209a91a76d03c20.png`.
2. Find the top-left background color and replace it with transparency, doing a soft blend to decontaminate magenta fringing.
3. Crop the image to its boundaries, resize to a sensible max width matching existing styles (716px width).
4. Save as PNG, AVIF, and WebP, overwriting the `public/assets/crystal-ball-pedestal.*` files.
5. Update `app/components/CrystalBall/CrystalBall.tsx` width/height attributes if changed.
6. Verify size against 495MB limit.
7. Fill out PR Summary and verify.
