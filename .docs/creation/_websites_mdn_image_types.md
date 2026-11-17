# Image file type and format guide

In this guide, we'll cover the image file types generally supported by web browsers, and provide insights that will help you select the most appropriate formats to use for your site's imagery.

## [Common image file types](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#common_image_file_types)

The image file formats that are most commonly used on the web are listed below.

| Abbreviation | File format | MIME type | File extension(s) | Summary |
| --- | --- | --- | --- | --- |
| [APNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#apng_animated_portable_network_graphics) | Animated Portable Network Graphics | `image/apng` | `.apng`, `.png` | Good choice for lossless animation sequences (GIF is less performant). AVIF and WebP have better performance but less broad browser support. **Support:** Chrome, Edge, Firefox, Opera, Safari. |
| [AVIF](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#avif_image) | AV1 Image File Format | `image/avif` | `.avif` | Good choice for both images and animated images due to high performance and royalty free image format. It offers much better compression than PNG or JPEG with support for higher color depths, animated frames, transparency, etc. Note that when using AVIF, you should include fallbacks to formats with better browser support (i.e., using the `<picture>` element). **Support:** Chrome, Edge, Firefox, Opera, Safari. |
| [GIF](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#gif_graphics_interchange_format) | Graphics Interchange Format | `image/gif` | `.gif` | Good choice for basic images and animations. Prefer PNG for lossless *and* indexed still images, and consider WebP, AVIF or APNG for animation sequences. **Support:** Chrome, Edge, Firefox, IE, Opera, Safari. |
| [JPEG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_joint_photographic_experts_group_image) | Joint Photographic Expert Group image | `image/jpeg` | `.jpg`, `.jpeg`, `.jfif`, `.pjpeg`, `.pjp` | Good choice for lossy compression of still images (currently the most popular). Prefer PNG when more precise reproduction of the image is required, or WebP/AVIF if both better reproduction and higher compression are required. **Support:** Chrome, Edge, Firefox, IE, Opera, Safari. |
| [JPEG XL](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_xl_image) | JPEG XL image | `image/jxl` | `.jxl` | Supports lossy and lossless compression, progressive decoding, HDR, wide color gamuts, transparency, and animation. Because browser support is not yet universal, provide a fallback using the `<picture>` element. **Support:** Chrome, Edge, Firefox, Safari. |
| [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) | Portable Network Graphics | `image/png` | `.png` | PNG is preferred over JPEG for more precise reproduction of source images, or when transparency is needed. WebP/AVIF provide even better compression and reproduction, but browser support is more limited. **Support:** Chrome, Edge, Firefox, IE, Opera, Safari. |
| [SVG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#svg_scalable_vector_graphics) | Scalable Vector Graphics | `image/svg+xml` | `.svg` | Vector image format; ideal for user interface elements, icons, diagrams, etc., that must be drawn accurately at different sizes. **Support:** Chrome, Edge, Firefox, IE, Opera, Safari. |
| [WebP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#webp_image) | Web Picture format | `image/webp` | `.webp` | Excellent choice for both images and animated images. WebP offers much better compression than PNG or JPEG with support for higher color depths, animated frames, transparency etc. AVIF offers slightly better compression, but is not quite as well-supported in browsers and does not support progressive rendering. **Support:** Chrome, Edge, Firefox, Opera, Safari |

**Note:** The older formats like PNG, JPEG, GIF have poor performance compared to newer formats like WebP and AVIF, but enjoy broader "historical" browser support. The newer image formats are seeing increasing popularity as browsers without support become increasingly irrelevant (i.e., have virtually zero market share).

The following list includes image formats that appear on the web, but which should be avoided for web content (generally this is because either they do not have wide browser support, or because there are better alternatives).

| Abbreviation | File format | MIME type | File extension(s) | Supported browsers |
| --- | --- | --- | --- | --- |
| [BMP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#bmp_bitmap_file) | Bitmap file | `image/bmp` | `.bmp` | Chrome, Edge, Firefox, IE, Opera, Safari |
| [ICO](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#ico_microsoft_windows_icon) | Microsoft Icon | `image/x-icon` | `.ico`, `.cur` | Chrome, Edge, Firefox, IE, Opera, Safari |
| [TIFF](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#tiff_tagged_image_file_format) | Tagged Image File Format | `image/tiff` | `.tif`, `.tiff` | Safari |

**Note:** The abbreviation for each image format links to a longer description of the format, its capabilities, and detailed browser compatibility information (including which versions introduced support and specific special features that may have been introduced later).

**Note:** Safari 11.1 added the ability to use a video format, as an animated gif replacement. No other browser supports this. See the [Chromium bug](https://crbug.com/791658), and [Firefox bug](https://bugzil.la/895131) for more information.

## [Image file type details](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#image_file_type_details)

The following sections provide a brief overview of each of the image file types supported by web browsers.

In the tables below, the term **bits per component** refers to the number of bits used to represent each color component. For example, an RGB color depth of 8 indicates that each of the red, green, and blue components are represented by an 8-bit value. **Bit depth**, on the other hand, is the total number of bits used to represent each pixel in memory.

### [APNG (Animated Portable Network Graphics)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#apng_animated_portable_network_graphics)

APNG is a file format first introduced by Mozilla which extends the [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) standard to add support for animated images. Conceptually similar to the animated GIF format which has been in use for decades, APNG is more capable in that it supports a variety of [color depths](https://en.wikipedia.org/wiki/Color_depth), whereas animated GIF supports only 8-bit [indexed color](https://en.wikipedia.org/wiki/Indexed_color).

APNG is ideal for basic animations that do not need to synchronize to other activities or to a sound track, such as progress indicators, activity [throbbers](https://en.wikipedia.org/wiki/Throbber), and other animated sequences. For example, APNG is [one of the formats supported when creating animated stickers](https://developer.apple.com/imessage/) for Apple's iMessage application (and the Messages application on iOS). They're also commonly used for the animated portions of web browsers' user interfaces.

| MIME type | `image/apng` |  |
| --- | --- | --- |
| File extension(s) | `.apng`, `.png` |  |
| Specification | [W3C PNG Specification](https://w3c.github.io/png/#apng-frame-based-animation) |  |
| Browser compatibility | Chrome 59, Edge 12, Firefox 3, Opera 46, Safari 8 |  |
| Maximum dimensions | 2,147,483,647×2,147,483,647 pixels |  |
| Supported color modes | Color mode Bits per component (*D*) Description Greyscale 1, 2, 4, 8, and 16 Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. True color 8 and 16 Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. Indexed color 1, 2, 4, and 8 Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. Greyscale with alpha 8 and 16 Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. True color with alpha 8 and 16 Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | 1, 2, 4, 8, and 16 | Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. |
| True color | 8 and 16 | Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. |
| Indexed color | 1, 2, 4, and 8 | Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. |
| Greyscale with alpha | 8 and 16 | Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. |
| True color with alpha | 8 and 16 | Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |
| Compression | Lossless |  |
| Licensing | Free and open under the [Creative Commons Attribution-ShareAlike license](https://creativecommons.org/licenses/by-sa/3.0/) ([CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/)) version 3.0 or later. |  |

### [AVIF image](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#avif_image)

AV1 Image File Format (AVIF) is a powerful, open source, royalty-free file format that encodes *AV1 bitstreams in the High Efficiency Image File Format (HEIF) container.*

**Note:** AVIF has potential to become the "next big thing" for sharing images in web content. It offers state-of-the-art features and performance, without the encumbrance of complicated licensing and patent royalties that have hampered comparable alternatives.

AV1 is a coding format that was originally designed for video transmission over the Internet. The format benefits from the significant advances in video encoding in recent years, and may potentially benefit from the associated support for hardware rendering. However it also has disadvantages for some cases, as video and image encoding have some different requirements.

The format offers:

- Excellent lossy compression compared to JPG and PNG for visually similar compression levels (e.g., lossy AVIF images are around 50% smaller than JPEG images).
- Generally, AVIF has better compression than WebP — median 50% vs. 30% compression for the same JPG set (source: [AVIF WebP Comparison](https://www.ctrl.blog/entry/webp-avif-comparison/) (CTRL Blog)).
- Lossless compression.
- Animation/multi-image storage (similar to animated GIFs, but with much better compression)
- Alpha channel support (i.e., for transparency).
- *High Dynamic Range* (HDR): support for storing images that can represent bigger contrasts between the lightest and darkest parts of the image.
- Wide Color Gamut: Support for images that can contain a larger range of colors.

AVIF does not support progressive rendering, so files must be fully downloaded before they can be displayed. This often has little impact on real-world user experience because AVIF files are much smaller than the equivalent JPEG or PNG files, and hence can be downloaded and displayed much faster. For larger file size the impact can become significant, and you should consider using a format that supports progressive rendering.

AVIF is supported in Chrome, Edge, Opera, Safari and Firefox. As support is not yet comprehensive (and has little historical depth) you should provide a fallback in [WebP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#webp_image), [JPEG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_joint_photographic_experts_group_image) or [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) format using [the `<picture>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) (or some other approach).

| MIME type | `image/avif` |
| --- | --- |
| File extension(s) | `.avif` |
| Specification | [AV1 Image File Format (AVIF)](https://aomediacodec.github.io/av1-avif/) |
| Browser compatibility | Chrome 85, Edge 121, Opera 71, Firefox 93, and Safari 16.1. Firefox 93 supports still images, with colorspace support for both full and limited range colors, image transforms for mirroring and rotation. The preference [image.avif.compliance_strictness](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features#avif_compliance_strictness) can be used to adjust the compliance strictness with the specification. Firefox 113 and later support animated images. |
| Maximum dimensions | 2,147,483,647×2,147,483,647 pixels |
| Supported color modes | Color mode support information is provided in the [AV1 Bitstream & Decoding Process Specification](https://aomediacodec.github.io/av1-spec/av1-spec.pdf), section 6.4.2 : Color config semantics. A non-exhaustive summary is: Color modes: YUV444, YUV422, YUV420 Greyscale support: YUV400 Bits: 8/10/12-bit Alpha support ICC profile support NCLX support: sRGB, linear sRGB, linear Rec2020, PQ Rec2020, HLG Rec2020, PQ P3, HLG P3, etc. Tiling support |
| Compression | Lossy and lossless. |
| Licensing | Royalty free. Licensing information is available at [License Page](https://aomedia.org/license/). |

### [BMP (Bitmap file)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#bmp_bitmap_file)

The **BMP** (**Bitmap image**) file type is most prevalent on Windows computers, and is generally used only for special cases in web apps and content.

**Warning:** You should typically avoid using BMP files for website content. The most common form of BMP file represents the data as an uncompressed raster image, resulting in large file sizes compared to png or jpg image types. More efficient BMP formats exist but are not widely used, and rarely supported in web browsers.

BMP theoretically supports a variety of internal data representations. The simplest, and most commonly used, form of BMP file is an uncompressed raster image, with each pixel occupying 3 bytes representing its red, green, and blue components, and each row padded with `0x00` bytes to a multiple of 4 bytes wide.

While other data representations are defined in the specification, they are not widely used and often completely unimplemented. These features include: support for different bit depths, indexed color, alpha channels, and different pixel orders (by default, BMP is written from bottom-left corner toward the right and top, rather than from the top-left corner toward the right and bottom).

Theoretically, several compression algorithms are supported, and the image data can also be stored in [JPEG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_joint_photographic_experts_group_image) or [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) format within the BMP file.

| MIME type | `image/bmp` |  |
| --- | --- | --- |
| File extension(s) | `.bmp` |  |
| Specification | No specification; however, Microsoft provides general documentation of the format at [docs.microsoft.com/en-us/windows/desktop/gdi/bitmap-storage](https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-storage) |  |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |  |
| Maximum dimensions | Either 32,767×32,767 or 2,147,483,647×2,147,483,647 pixels, depending on the format version |  |
| Supported color modes | Color mode Bits per component (*D*) Description Greyscale 1 Each bit represents a single pixel, which can be either black or white. True color 8 and 16 Each pixel is represented by three values representing the red, green, and blue color components; each is *D* bits. Indexed color 2, 4, and 8 Each pixel is represented by a value which is one 2, 4, or 8 bits, serving as an index into the color table. Greyscale with alpha *n/a* BMP has no distinct grayscale format. True color with alpha 8 and 16 Each pixel is represented by four values representing the red, green, blue, and alpha color components; each is *D* bits. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | 1 | Each bit represents a single pixel, which can be either black or white. |
| True color | 8 and 16 | Each pixel is represented by three values representing the red, green, and blue color components; each is *D* bits. |
| Indexed color | 2, 4, and 8 | Each pixel is represented by a value which is one 2, 4, or 8 bits, serving as an index into the color table. |
| Greyscale with alpha | *n/a* | BMP has no distinct grayscale format. |
| True color with alpha | 8 and 16 | Each pixel is represented by four values representing the red, green, blue, and alpha color components; each is *D* bits. |
| Compression | Several compression methods are supported, including lossy or lossless algorithms |  |
| Licensing | Covered by the [Microsoft Open Specification Promise](https://learn.microsoft.com/en-us/openspecs/dev_center/ms-devcentlp/1c24c7c8-28b0-4ce1-a47d-95fe1ff504bc); while Microsoft holds patents against BMP, they have published a promise not to assert its patent rights as long as specific conditions are met. This is not the same as a license, however. BMP is included under the Windows Metafile Format (`.wmf`). |  |

### [GIF (Graphics Interchange Format)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#gif_graphics_interchange_format)

In 1987, the CompuServe online service provider introduced the **[GIF](https://en.wikipedia.org/wiki/GIF)** (**Graphics Interchange Format**) image file format to provide a compressed graphics format that all members of their service would be able to use. GIF uses the [Lempel-Ziv-Welch](https://en.wikipedia.org/wiki/Lempel-Ziv-Welch) (LZW) algorithm to losslessly compress 8-bit indexed color graphics. GIF was one of the first two graphics formats supported by [HTML](https://developer.mozilla.org/en-US/docs/Glossary/HTML), along with [XBM](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#xbm_x_window_system_bitmap_file).

Each pixel in a GIF is represented by a single 8-bit value serving as an index into a palette of 24-bit colors (8 bits each of red, green, and blue). The length of a color table is always a power of 2 (that is, each palette has 2, 4, 8, 16, 32, 64, or 256 entries). To simulate more than 255 or 256 colors, [dithering](https://en.wikipedia.org/wiki/Dithering) is generally used. It is [technically possible](https://gif.ski/) to tile multiple image blocks, each with its own color palette, to create true color images, but in practice this is rarely done.

Pixels are opaque, unless a specific color index is designated as transparent, in which case pixels colored that value are entirely transparent.

GIF supports simple animation, in which following an initial full-size frame, a series of images reflecting the parts of the image that change with each frame are provided.

GIF has been extremely popular for decades, due to its simplicity and compatibility. Its animation support caused a resurgence in its popularity in the social media era, when animated GIFs began to be widely used for short "videos", memes, and other simple animation sequences.

Another popular feature of GIF is support for [interlacing](https://en.wikipedia.org/wiki/Interlacing_(bitmaps)), where rows of pixels are stored out of order so that partially-received files can be displayed in lower quality. This is particularly useful when network connections are slow.

GIF is a good choice for simple images and animations, although converting full color images to GIF can result in unsatisfactory dithering. Typically, modern content should use [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) for lossless *and* indexed still images, and should consider using [APNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#apng_animated_portable_network_graphics) for lossless animation sequences.

| MIME type | `image/gif` |  |
| --- | --- | --- |
| File extension(s) | `.gif` |  |
| Specification | [GIF87a specification](https://www.w3.org/Graphics/GIF/spec-gif87.txt) [GIF89a specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt) |  |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |  |
| Maximum dimensions | 65,536×65,536 pixels |  |
| Supported color modes | Color mode Bits per component (*D*) Description Greyscale *n/a* GIF does not include a dedicated greyscale format. True color *n/a* GIF does not support true color pixels. Indexed color 8 Each color in a GIF palette is defined as 8 bits each of red, green, and blue (24 total bits per pixel). Greyscale with alpha *n/a* GIF does not provide a dedicated greyscale format. True color with alpha *n/a* GIF does not support true color pixels. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | *n/a* | GIF does not include a dedicated greyscale format. |
| True color | *n/a* | GIF does not support true color pixels. |
| Indexed color | 8 | Each color in a GIF palette is defined as 8 bits each of red, green, and blue (24 total bits per pixel). |
| Greyscale with alpha | *n/a* | GIF does not provide a dedicated greyscale format. |
| True color with alpha | *n/a* | GIF does not support true color pixels. |
| Compression | Lossless (LZW) |  |
| Licensing | While the GIF format itself is open, the LZW compression algorithm was covered by patents until the early 2000s. As of July 7, 2004, all relevant patents have expired and the GIF format may be used freely |  |

### [ICO (Microsoft Windows icon)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#ico_microsoft_windows_icon)

The ICO (Microsoft Windows icon) file format was designed by Microsoft for desktop icons of Windows systems. However, early versions of Internet Explorer introduced the ability for a website to provide an ICO file named `favicon.ico` in a website's root directory to specify a **[favicon](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata#adding_custom_icons_to_your_site)** — an icon to be displayed in the Favorites menu, and other places where an iconic representation of the site would be useful.

An ICO file can contain multiple icons, and begins with a directory listing details about each. Following the directory comes the data for the icons. Each icon's data can be either a [BMP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#bmp_bitmap_file) image without the file header, or a complete [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) image (including the file header). If you use ICO files, you should use the BMP format, as support for PNG inside ICO files wasn't added until Windows Vista and may not be well supported.

**Warning:** ICO files *should not* be used in web content. Additionally, their use for favicons has subsided in favor of using a PNG file and the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link) element, as described in [Providing icons for different usage contexts](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link#providing_icons_for_different_usage_contexts).

| MIME type | `image/vnd.microsoft.icon` (official), `image/x-icon` (used by Microsoft) |  |
| --- | --- | --- |
| File extension(s) | `.ico` |  |
| Specification |  |  |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |  |
| Maximum dimensions | 256×256 pixels |  |
| Supported color modes | Icons in BMP format Color mode Bits per component (*D*) Description Greyscale 1 Each bit represents a single pixel, which can be either black or white. True color 8 and 16 Each pixel is represented by three values representing the red, green, and blue color components; each is *D* bits. Indexed color 2, 4, and 8 Each pixel is represented by a value which is one 2, 4, or 8 bits, serving as an index into the color table. Greyscale with alpha *n/a* BMP has no distinct grayscale format. True color with alpha 8 and 16 Each pixel is represented by four values representing the red, green, blue, and alpha color components; each is *D* bits. Icons in PNG format Color mode Bits per component (*D*) Description Greyscale 1, 2, 4, 8, and 16 Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. True color 8 and 16 Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. Indexed color 1, 2, 4, and 8 Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. Greyscale with alpha 8 and 16 Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. True color with alpha 8 and 16 Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | 1 | Each bit represents a single pixel, which can be either black or white. |
| True color | 8 and 16 | Each pixel is represented by three values representing the red, green, and blue color components; each is *D* bits. |
| Indexed color | 2, 4, and 8 | Each pixel is represented by a value which is one 2, 4, or 8 bits, serving as an index into the color table. |
| Greyscale with alpha | *n/a* | BMP has no distinct grayscale format. |
| True color with alpha | 8 and 16 | Each pixel is represented by four values representing the red, green, blue, and alpha color components; each is *D* bits. |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | 1, 2, 4, 8, and 16 | Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. |
| True color | 8 and 16 | Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. |
| Indexed color | 1, 2, 4, and 8 | Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. |
| Greyscale with alpha | 8 and 16 | Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. |
| True color with alpha | 8 and 16 | Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |
| Compression | BMP-format icons nearly always use lossless compression, but lossy methods are available. PNG icons are always compressed losslessly. |  |
| Licensing | — |  |

### [JPEG (Joint Photographic Experts Group image)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_joint_photographic_experts_group_image)

The [JPEG](https://developer.mozilla.org/en-US/docs/Glossary/JPEG) (typically pronounced "**jay-peg**") image format is currently the most widely used lossy compression format for still images. It's particularly useful for photographs; applying lossy compression to content requiring sharpness, like diagrams or charts, can produce unsatisfactory results.

JPEG is actually a data format for compressed photos, rather than a file type. The JFIF (**J**PEG **F**ile **I**nterchange **F**ormat) specification describes the format of the files we think of as "JPEG" images.

| MIME type | `image/jpeg` |  |
| --- | --- | --- |
| File extension(s) | `.jpg`, `.jpeg`, `.jpe`, `.jif`, `.jfif` |  |
| Specification | [jpeg.org/jpeg/](https://jpeg.org/jpeg/) |  |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |  |
| Maximum dimensions | 65,535×65,535 pixels |  |
| Supported color modes | Color mode Bits per component (*D*) Description Greyscale *n/a* True greyscale can be supported using the single luma channel (Y). True color 8 Each pixel is described by the red, blue, and green color components, each of which is 8 bits. Indexed color *n/a* JPEG does not offer an indexed color mode. Greyscale with alpha *n/a* JPEG does not support an alpha channel. True color with alpha *n/a* JPEG does not support an alpha channel. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | *n/a* | True greyscale can be supported using the single luma channel (Y). |
| True color | 8 | Each pixel is described by the red, blue, and green color components, each of which is 8 bits. |
| Indexed color | *n/a* | JPEG does not offer an indexed color mode. |
| Greyscale with alpha | *n/a* | JPEG does not support an alpha channel. |
| True color with alpha | *n/a* | JPEG does not support an alpha channel. |
| Compression | Lossy; based on the [discrete cosine transform](https://en.wikipedia.org/wiki/Discrete_cosine_transform) |  |
| Licensing | As of October 27, 2006, all United States patents have expired. |  |

### [JPEG XL image](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_xl_image)

JPEG XL (JXL) is a royalty-free raster image format standardized as ISO/IEC 18181. It supports lossy and lossless compression, progressive decoding, high bit depths, wide color gamuts, high dynamic range (HDR), transparency, and animation. JPEG XL can also losslessly transcode existing JPEG images, allowing the original JPEG file to be reconstructed.

Browser support is not yet universal. When using JPEG XL, provide an alternative format such as AVIF, WebP, or JPEG [with the `<picture>` element](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#providing_image_fallbacks).

| MIME type | `image/jxl` |
| --- | --- |
| File extension(s) | `.jxl` |
| Specification | [ISO/IEC 18181 (JPEG XL)](https://jpeg.org/jpegxl/workplan.html) |
| Browser compatibility | Chrome 155, Firefox 158, and Safari 17. Safari does not support progressive download of JPEG XL files (it can render them after complete download). |
| Maximum dimensions | 1,073,741,823×1,073,741,823 pixels |
| Supported color modes | Greyscale and color images, with optional alpha channels, high bit depths, wide color gamuts, and HDR. |
| Compression | Lossy and lossless. |
| Licensing | Royalty-free. The format's contributors [committed to a royalty-free release](https://jpeg.org/items/20190803_press.html) during standardization, and there are no known royalty-bearing patents. The decoder implementations shipped by browsers are open source with additional patent grants. |

### [PNG (Portable Network Graphics)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics)

The [PNG](https://developer.mozilla.org/en-US/docs/Glossary/PNG) (pronounced "**ping**") image format uses lossless compression, while supporting higher color depths than [GIF](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#gif_graphics_interchange_format) and being more efficient, as well as featuring full alpha transparency support.

PNG is widely supported, with all major browsers offering full support for its features.

| MIME type | `image/png` |  |
| --- | --- | --- |
| File extension(s) | `.png` |  |
| Specification | [Portable Network Graphics (PNG) Specification](https://w3c.github.io/png/) |  |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |  |
| Maximum dimensions | 2,147,483,647×2,147,483,647 pixels |  |
| Supported color modes | Color mode Bits per component (*D*) Description Greyscale 1, 2, 4, 8, and 16 Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. True color 8 and 16 Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. Indexed color 1, 2, 4, and 8 Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. Greyscale with alpha 8 and 16 Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. True color with alpha 8 and 16 Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |  |
| Color mode | Bits per component (*D*) | Description |
| Greyscale | 1, 2, 4, 8, and 16 | Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. |
| True color | 8 and 16 | Each pixel is represented by three *D*-bit values indicating the level of the red, green, and blue color components. |
| Indexed color | 1, 2, 4, and 8 | Each pixel is a *D*-bit value indicating an index into a color palette which is contained within a `PLTE` chunk in the APNG file; the colors in the palette all use an 8-bit depth. |
| Greyscale with alpha | 8 and 16 | Each pixel is represented by two *D*-bit values: the intensity of the greyscale pixel and an alpha sample, indicating how opaque the pixel is. |
| True color with alpha | 8 and 16 | Each pixel is comprised of four *D*-pixel color components: red, green, blue, and the alpha sample indicating how opaque the pixel is. |
| Compression | Lossless, optionally indexed color like GIF |  |
| Licensing | ©2003 [W3C](https://www.w3.org/) ([MIT](https://www.csail.mit.edu/), [ERCIM](https://www.ercim.eu/), [Keio](https://www.keio.ac.jp/)), All Rights Reserved. W3C [liability](https://www.w3.org/policies/#disclaimers), [trademark](https://www.w3.org/policies/#trademarks), [document use](https://www.w3.org/copyright/document-license/) and [software licensing](https://www.w3.org/copyright/software-license/) rules apply. No known royalty-bearing patents. |  |

### [SVG (Scalable Vector Graphics)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#svg_scalable_vector_graphics)

[SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) is an [XML](https://developer.mozilla.org/en-US/docs/Glossary/XML)-based [vector graphics](https://en.wikipedia.org/wiki/Vector_graphics) format that specifies the contents of an image as a set of drawing commands that create shapes, lines, apply colors, filters, and so forth. SVG files are ideal for diagrams, icons, and other images which can be accurately drawn at any size. As such, SVG is popular for user interface elements in modern Web design.

SVG files are text files containing source code that, when interpreted, draws the desired image. For instance, this example defines a drawing area with initial size 100 by 100 units, containing a line drawn diagonally through the box:

html

```
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="80" x2="100" y2="20" stroke="black" />
</svg>
```

SVG can be used in web content in three ways:

1. An [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg) element can appear directly within the HTML. It can contain [SVG elements](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element) to draw the image.
2. An SVG image can be embedded in HTML using elements such as [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), [`<object>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/object) and [`<embed>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/embed).
3. It is possible to use SVG images anywhere where other image types can be used, including with the [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) element, the [`background-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image) CSS property, and so forth. However, there are [additional restrictions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image) when SVG is used in this way.

SVG is an ideal choice for images which can be represented using a series of drawing commands, especially if the size at which the image will be rendered is unknown or may vary, since SVG will smoothly scale to the desired size. It's not generally useful for strictly bitmap or photographic images, although it is possible to include bitmap images within an SVG.

| MIME type | `image/svg+xml` |
| --- | --- |
| File extension(s) | `.svg` |
| Specification | [Scalable Vector Graphics (SVG) 2](https://w3c.github.io/svgwg/svg2-draft/) |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari |
| Maximum dimensions | Unlimited |
| Supported color modes | Colors in SVG are specified using [CSS color syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value). |
| Compression | SVG source may be compressed during transit using [HTTP compression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression) techniques, or on disk as an `.svgz` file. |
| Licensing | ©2018 [W3C](https://www.w3.org/) ([MIT](https://www.csail.mit.edu/), [ERCIM](https://www.ercim.eu/), [Keio](https://www.keio.ac.jp/), [Beihang](https://ev.buaa.edu.cn/)), All Rights Reserved. W3C [liability](https://www.w3.org/policies/#disclaimers), [trademark](https://www.w3.org/policies/#trademarks), [document use](https://www.w3.org/copyright/document-license/) and [software licensing](https://www.w3.org/copyright/software-license/) rules apply. No known royalty-bearing patents. |

### [TIFF (Tagged Image File Format)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#tiff_tagged_image_file_format)

[TIFF](https://en.wikipedia.org/wiki/TIFF) is a raster graphics file format which was created to store scanned photos, although it can be any kind of image. It is a somewhat "heavy" format, in that TIFF files have a tendency to be larger than images in other formats. This is because of the metadata often included, as well as the fact that most TIFF images are either uncompressed or use compression algorithms that still leave fairly large files after compression.

TIFF supports a variety of compression methods, but the most commonly used are the CCITT Group 4 (and, for older fax systems, Group 3) compression systems used for by fax software, as well as LZW and lossy JPEG compression.

Every value in a TIFF file is specified using its **tag** (indicating what kind of information it is, such as the width of the image) and its **type** (indicating the format the data is stored in), followed by the length of the array of values to assign to that tag (all properties are stored in arrays, even for single values). This allows different data types to be used for the same properties. For example, the width of an image, `ImageWidth`, is stored using tag `0x0100`, and is a one-entry array. By specifying type 3 (`SHORT`), the value of `ImageWidth` is stored as a 16-bit value:

| Tag | Type | Size | Value |
| --- | --- | --- | --- |
| `0x0100` (`ImageWidth`) | `0x0003` (`SHORT`) | `0x00000001` (1 entry) | `0x0280` (640 pixels) |

Specifying type 4 (`LONG`) stores the width as a 32-bit value:

| Tag | Type | Size | Value |
| --- | --- | --- | --- |
| `0x0100` (`ImageWidth`) | `0x0004` (`LONG`) | `0x00000001` (1 entry) | `0x00000280` (640 pixels) |

A single TIFF file can contain multiple images; this may be used to represent multi-page documents, for example (such as a multi-page scanned document, or a received fax). However, software reading TIFF files is only required to support the first image.

TIFF supports a variety of color spaces, not just RGB. These include CMYK, YCbCr, and others, making TIFF a good choice for storing images intended for print, film, or television media.

Other than Safari, browsers do not natively support TIFF images in web content except by using special libraries or browser add-ons. As such, TIFF files are not broadly used for displaying web content, *but* it's common to provide downloadable TIFF files when distributing photos and other artwork intended for precision editing or printing.

| MIME type | `image/tiff` |  |
| --- | --- | --- |
| File extension(s) | `.tif`, `.tiff` |  |
| Specification | [https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577413_pgfId-1035272](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/) |  |
| Browser compatibility | Safari |  |
| Maximum dimensions | 4,294,967,295×4,294,967,295 pixels (theoretical) |  |
| Supported color modes | Color mode Bits per component (*D*) Description Bilevel 1 A bilevel TIFF stores 8 bits in each byte, one bit per pixel. The `PhotometricInterpretation` field specifies which of 0 and 1 are black and which is white. Greyscale 4 and 8 Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. True color 8 All true color RGB images are stored using 8-bits each of red, green, and blue. Indexed color 4 and 8 Each pixel is an index into a `ColorMap` record, which defines the colors used in the image. The color map lists all of the red values, then all of the green values, then all of the blue values (rather than `rgb, rgb, rgb…`). Greyscale with alpha 4 and 8 Alpha information is added by specifying that there are more than 3 samples per pixel in the `SamplesPerPixel` field, and indicating the type of alpha (1 for an associated, pre-multiplied alpha component, and 2 for unassociated alpha - a separate matte); however, alpha channels are rarely used in TIFF files and may be unsupported by the user's software. True color with alpha 8 Alpha information is added by specifying that there are more than 3 samples per pixel in the `SamplesPerPixel` field, and indicating the type of alpha (1 for an associated, pre-multiplied alpha component, and 2 for unassociated alpha - a separate matte); however, alpha channels are rarely used in TIFF files and may be unsupported by the user's software. |  |
| Color mode | Bits per component (*D*) | Description |
| Bilevel | 1 | A bilevel TIFF stores 8 bits in each byte, one bit per pixel. The `PhotometricInterpretation` field specifies which of 0 and 1 are black and which is white. |
| Greyscale | 4 and 8 | Each pixel consists of a single *D*-bit value indicating the brightness of the greyscale pixel. |
| True color | 8 | All true color RGB images are stored using 8-bits each of red, green, and blue. |
| Indexed color | 4 and 8 | Each pixel is an index into a `ColorMap` record, which defines the colors used in the image. The color map lists all of the red values, then all of the green values, then all of the blue values (rather than `rgb, rgb, rgb…`). |
| Greyscale with alpha | 4 and 8 | Alpha information is added by specifying that there are more than 3 samples per pixel in the `SamplesPerPixel` field, and indicating the type of alpha (1 for an associated, pre-multiplied alpha component, and 2 for unassociated alpha - a separate matte); however, alpha channels are rarely used in TIFF files and may be unsupported by the user's software. |
| True color with alpha | 8 | Alpha information is added by specifying that there are more than 3 samples per pixel in the `SamplesPerPixel` field, and indicating the type of alpha (1 for an associated, pre-multiplied alpha component, and 2 for unassociated alpha - a separate matte); however, alpha channels are rarely used in TIFF files and may be unsupported by the user's software. |
| Compression | Most TIFF files are uncompressed, but lossless PackBits and LZW compression are supported, as is lossy JPEG compression. |  |
| Licensing | No license required (aside from any associated with libraries you might use); all known patents have expired. |  |

### [WebP image](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#webp_image)

WebP supports lossy compression via predictive coding based on the VP8 video codec, and lossless compression that uses substitutions for repeating data. Lossy WebP images are on average 25–35% smaller than JPEG images of visually similar compression levels. Lossless WebP images are typically 26% smaller than the same images in PNG format.

WebP also supports animation: in a lossy WebP file, the image data is represented by a VP8 bitstream, which may contain multiple frames. Lossless WebP holds the `ANIM` chunk, which describes the animation, and the `ANMF` chunk, which represents a frame of an animation sequence. Looping is supported.

WebP now has broad support in the latest versions of major web browsers, although it does not have deep historical support. Provide a fallback in either [JPEG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_joint_photographic_experts_group_image) or [PNG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#png_portable_network_graphics) format, such as with [the `<picture>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture).

| MIME type | `image/webp` |
| --- | --- |
| File extension(s) | `.webp` |
| Specification | [RIFF Container Specification](https://developers.google.com/speed/webp/docs/riff_container) [RFC 6386: VP8 Data Format and Decoding Guide](https://datatracker.ietf.org/doc/html/rfc6386) (lossy encoding) [WebP Lossless Bitstream Specification](https://developers.google.com/speed/webp/docs/webp_lossless_bitstream_specification) |
| Browser compatibility | All versions of Chrome, Edge, Firefox, Opera, and Safari WebP can also be used for *exporting* images from a Canvas. See [`HTMLCanvasElement.toBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#browser_compatibility) for more detailed support version information. |
| Maximum dimensions | 16,383×16,383 pixels |
| Supported color modes | Lossy WebP stores the image in 8-bit Y'CbCr 4:2:0 (YUV420) format. Lossless WebP uses 8-bit ARGB color, with each component taking 8 bits for a total of 32 bits per pixel. |
| Compression | Lossless (Huffman, LZ77, or color cache codes) or lossy (VP8). |
| Licensing | No license required; source code is openly available. |

**Note:** On Safari for macOS, WebP support depends on both Safari and macOS versions. You need Safari 14 or later as well as macOS Big Sur (11) or a more recent version.

### [XBM (X Window System Bitmap file)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#xbm_x_window_system_bitmap_file)

XBM (X Bitmap) files were the first to be supported on the Web, but are no longer used and should be avoided, as their format has potential security concerns. Modern browsers have not supported XBM files in many years, but when dealing with older content, you may find some still around.

XBM uses a snippet of C code to represent the contents of the image as an array of bytes. Each image consists of 2 to 4 `#define` directives, providing the width and height of the bitmap (and optionally the hotspot, if the image is designed as a cursor), followed by an array of `unsigned char`, where each value contains 8 1-bit monochrome pixels.

The image must be a multiple of 8 pixels wide. For example, the following code represents an XBM image which is 8 pixels by 8 pixels, with those pixels in a black-and-white checkerboard pattern:

c

```
#define square8_width 8
#define square8_height 8
static unsigned char square8_bits[] = {
  0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55
};
```

| MIME type | `image/xbm`, `image-xbitmap` |  |
| --- | --- | --- |
| File extension(s) | `.xbm` |  |
| Specification | None |  |
| Browser compatibility | Firefox 1–3.5, Internet Explorer 1–5 |  |
| Maximum dimensions | Unlimited |  |
| Supported color modes | Color mode Bits per component Description Greyscale 1 Each byte contains eight 1-bit pixels. True color *n/a* *n/a* Indexed color *n/a* *n/a* Greyscale with alpha *n/a* *n/a* True color with alpha *n/a* *n/a* |  |
| Color mode | Bits per component | Description |
| Greyscale | 1 | Each byte contains eight 1-bit pixels. |
| True color | *n/a* | *n/a* |
| Indexed color | *n/a* | *n/a* |
| Greyscale with alpha | *n/a* | *n/a* |
| True color with alpha | *n/a* | *n/a* |
| Compression | Lossless |  |
| Licensing | Open source |  |

## [Choosing an image format](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#choosing_an_image_format)

Image formats are usually selected based on factors such as compression, quality, breadth and depth of browser support, and whether you need features such as transparency or animation.

For raster images, prefer [WebP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#webp_image) or [AVIF](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#avif_image), which generally provide better compression than PNG, JPEG, and GIF. You should also consider [JPEG XL](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#jpeg_xl_image) for large, high-resolution raster images. Most browsers can progressively render them by displaying an initial version before the full image downloads.

If you need to support browsers that don't allow WebP, AVIF, or JPEG XL, use the [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) element to provide a PNG or JPEG fallback. This is shown in [Providing image fallbacks](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#providing_image_fallbacks) below.

Compression can be lossy, discarding image data to get much smaller files, or lossless, reproducing the original exactly. For screenshots, diagrams, logos, and line art, prefer lossless encoding, as blurring and colored fringes around text and sharp edges are very visible. Photographs and other continuous-tone images can usually tolerate lossy compression, because the discarded detail is harder to see. WebP and AVIF support both lossy and lossless compression as a setting you choose when encoding. JPEG is lossy, so it is often a good fallback format for photographs, while PNG is lossless, making it better for screenshots, diagrams, and line art. PNG is also the fallback for any image needing transparency, as JPEG has no alpha channel.

For diagrams, charts, and other images that must be drawn accurately at different sizes, use [SVG](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#svg_scalable_vector_graphics). Most icons have vector graphics versions, and you should prioritize the SVG version whenever possible. If only raster versions are available, choose [WebP](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#webp_image) but provide fallback like other raster images.

## [Providing image fallbacks](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#providing_image_fallbacks)

While the standard HTML [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) element doesn't support compatibility fallbacks for images, the [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) element does. `<picture>` is used as a wrapper for a number of [`<source>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/source) elements, each specifying a version of the image in a different format or under different [media conditions](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media), as well as an `<img>` element which defines where to display the image and the fallback to the default or "most compatible" version.

For example, if you're displaying a diagram best displayed with SVG, but wish to offer a fallback to a PNG or GIF of the diagram, you would do something like this:

html

```
<picture>
  <source srcset="diagram.svg" type="image/svg+xml" />
  <source srcset="diagram.webp" type="image/webp" />
  <source srcset="diagram.png" type="image/png" />
  <img
    src="diagram.gif"
    width="620"
    height="540"
    alt="Diagram showing the data channels" />
</picture>
```

You can specify as many `<source>`s as you wish, though typically 2 or 3 is all you need.

## [See also](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types#see_also)

- [Guide to media types and formats](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats)
- [Web media technologies](https://developer.mozilla.org/en-US/docs/Web/Media)
- [Guide to video codecs used on the web](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs)
- The [HTML](https://developer.mozilla.org/en-US/docs/Glossary/HTML) [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) and [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) elements
- The CSS [`background-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image) property
- The [`Image()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image) constructor and the [`HTMLImageElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) interface

## Help improve MDN

  [Learn how to contribute](https://developer.mozilla.org/en-US/docs/MDN/Community/Getting_started)

This page was last modified on Nov 5, 2026 by [MDN contributors](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types/contributors.txt).

 [View this page on GitHub](https://github.com/mdn/content/blob/main/files/en-us/web/media/guides/formats/image_types/index.md?plain=1) • [Report a problem with this content](https://github.com/mdn/content/issues/new?template=page-report.yml&mdn-url=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FMedia%2FGuides%2FFormats%2FImage_types&metadata=%3C%21--+Do+not+make+changes+below+this+line+--%3E%0A%3Cdetails%3E%0A%3Csummary%3EPage+report+details%3C%2Fsummary%3E%0A%0A*+Folder%3A+%60en-us%2Fweb%2Fmedia%2Fguides%2Fformats%2Fimage_types%60%0A*+MDN+URL%3A+https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FMedia%2FGuides%2FFormats%2FImage_types%0A*+GitHub+URL%3A+https%3A%2F%2Fgithub.com%2Fmdn%2Fcontent%2Fblob%2Fmain%2Ffiles%2Fen-us%2Fweb%2Fmedia%2Fguides%2Fformats%2Fimage_types%2Findex.md%0A*+Last+commit%3A+https%3A%2F%2Fgithub.com%2Fmdn%2Fcontent%2Fcommit%2F0ac0038dcfebe080906448b90eedfe6db0a29f0a%0A*+Document+last+modified%3A+2026-11-05T22%3A48%3A29.000Z%0A%0A%3C%2Fdetails%3E)
