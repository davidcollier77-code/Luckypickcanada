### axe.commons.dom.getRootNode

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Returns the document or document fragment (open shadow DOM) for a given node.

```APIDOC
## axe.commons.dom.getRootNode

### Description
Return the document or document fragment (open shadow DOM).

### Synopsis
axe.commons.dom.getRootNode(node);

### Parameters
- **element** (HTMLElement) - Required - The element for which you want to find the root node.

### Returns
The top-level document or shadow DOM document fragment.
```

--------------------------------

### Documenting functions with JSDoc

Source: https://github.com/dequelabs/axe-core/blob/develop/CONTRIBUTING.md

Use JSDoc comment blocks before function definitions to describe parameters, return types, and asynchronous behavior.

```js
/**
 * Runs the Audit; which in turn should call `run` on each rule.
 * @async
 * @param  {Context}   context The scope definition/context for analysis (include/exclude)
 * @param  {Object}    options Options object to pass into rules and/or disable rules or checks
 * @param  {Function} fn       Callback function to fire when audit is complete
 */
```

--------------------------------

### axe.run

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Runs accessibility rules against the document or a specific node. It accepts an optional configuration object and a callback function to handle results.

```APIDOC
## axe.run(context, options, callback)

### Description
Runs accessibility rules against the provided context. The results are returned via a callback function.

### Parameters
- **context** (Object) - Required - The DOM node or selector to run the audit on.
- **options** (Object) - Optional - Configuration object for rules and settings.
- **callback** (Function) - Required - Function invoked with (err, results) arguments.
```

--------------------------------

### axe.configure

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/check-options.md

Configures check options to modify how specific rules behave during accessibility testing.

```APIDOC
## axe.configure

### Description
Configures the behavior of specific checks by overriding their default options. This allows users to tailor accessibility rules to specific project requirements.

### Parameters
- **checks** (Array) - Required - A list of check configuration objects.
  - **id** (String) - Required - The identifier of the check to configure.
  - **options** (Object) - Required - The specific options to apply to the check.

### Example
```js
axe.configure({
  checks: [
    {
      id: 'has-lang',
      options: {
        attributes: ['lang', 'xml:lang', 'hreflang']
      }
    }
  ]
});
```
```

--------------------------------

### axe-core 4.0.0 Release Notes

Source: https://github.com/dequelabs/axe-core/blob/develop/CHANGELOG.md

The full v4.0.0 changelog entry listing breaking changes (removed rules/checks), features, and bug fixes for the major version 4 release.

```markdown
## [4.0.0](https://github.com/dequelabs/axe-core/compare/v3.5.5...v4.0.0) (2020-07-28)

### Breaking Changes

The following rules were deprecated in axe-core 3.x, and are removed in 4.0:

- aria-dpub-role-fallback
- checkboxgroup
- layout-table
- radiogroup
- video-description

The following checks were deprecated in axe-core 3.x, and are removed in 4.0:

- aria/implicit-role-fallback
- forms/fieldset
- forms/group-labelledby
- media/description
- tables/has-caption
- tables/has-summary
- tables/has-th

### Features

- add layout-table-matches method ([#2400](https://github.com/dequelabs/axe-core/issues/2400)) ([d7ba70f](https://github.com/dequelabs/axe-core/commit/d7ba70fc9916cedb2e977c9dc10667985c2bb4ed))
- **aria/get-roles-by-type:** deprecate in favor of standards/get-aria-roles-by-type ([#2362](https://github.com/dequelabs/axe-core/issues/2362)) ([c0c37ea](https://github.com/dequelabs/axe-core/commit/c0c37ea22f306cc93341fe25e173e3f65b6f924b))
- **aria/lookupTable, aria-allowed-attr:** deprecate aria.lookupTable and passing allowed attributes to aria-allowed-attr ([#2395](https://github.com/dequelabs/axe-core/issues/2395)) ([739d1b1](https://github.com/dequelabs/axe-core/commit/739d1b11052c93c0856e6e5d217b66e613e43f11))
- **avoid-inline-spacing:** add option for which css properties to look at ([#2244](https://github.com/dequelabs/axe-core/issues/2244)) ([93c027a](https://github.com/dequelabs/axe-core/commit/93c027ab7d081dcda401399e1cbdb5a27026c927))
- **checks:** normalize check options to alway be an object ([#2219](https://github.com/dequelabs/axe-core/issues/2219)) ([da12da7](https://github.com/dequelabs/axe-core/commit/da12da79b1e7a16887807980e03d4e8244bed560))
- **checks,rules:** remove deprecated checks and rules ([#2214](https://github.com/dequelabs/axe-core/issues/2214)) ([317545a](https://github.com/dequelabs/axe-core/commit/317545a0916a16e05263d1cedb6d9753e4ef6e19))
- **closest:** VirtualNode implementation of Element.closest. Deprecate commons.dom.findUp and commons.dom.findUpVirtual ([#2139](https://github.com/dequelabs/axe-core/issues/2139)) ([493dd22](https://github.com/dequelabs/axe-core/commit/493dd2253606189a5e475c691aa8f0dc68a8aedd))
- **color-contrast, utils:** add more options to color-contrast, add utils.deepMerge, deprecate commons.color.hasValidContrastRatio ([#2256](https://github.com/dequelabs/axe-core/issues/2256)) ([49fdb46](https://github.com/dequelabs/axe-core/commit/49fdb46cf371321760a3bdff6acc5311b4cfd158))
- **commons/aria:** deprecate getRole({ noImplicit }) for getExplicitRole() ([#2294](https://github.com/dequelabs/axe-core/issues/2294)) ([a2873ea](https://github.com/dequelabs/axe-core/commit/a2873ea41f5b264165a2fb76679ab121985bb4f2))
- **commons/standards:** create the commons/standards object for helper functions against the standards table ([#2358](https://github.com/dequelabs/axe-core/issues/2358)) ([6dce974](https://github.com/dequelabs/axe-core/commit/6dce974ee5f3095143818fbf5180d21762fe5de6))
- **duplicate-img-label:** add option for parentSelector ([#2216](https://github.com/dequelabs/axe-core/issues/2216)) ([8906806](https://github.com/dequelabs/axe-core/commit/8906806fa039ba105bea745495e91031461af445))
- **get-role:** add presentation role resolution and inheritance ([#2281](https://github.com/dequelabs/axe-core/issues/2281)) ([e207190](https://github.com/dequelabs/axe-core/commit/e2071900c462048a7455ec1f41878ab4f70b1bdd))
- **get-role:** work with standards object ([#2367](https://github.com/dequelabs/axe-core/issues/2367)) ([1b20faf](https://github.com/dequelabs/axe-core/commit/1b20faf73417fde425dadfe1ac0a359d2179c1a1))
- **globals:** deduce required window and document globals from context ([#2308](https://github.com/dequelabs/axe-core/issues/2308)) ([61bac69](https://github.com/dequelabs/axe-core/commit/61bac69877da884a9a24b040f898a67c6746984f))
- **has-descendant, page-no-duplicate:** move page-has-elm and page-no-duplicate to generic check ([#2229](https://github.com/dequelabs/axe-core/issues/2229)) ([59125a0](https://github.com/dequelabs/axe-core/commit/59125a056d4b591ee20a67be12e1c66e83ec7c25))
- **has-lang:** add option for which attributes to look at ([#2239](https://github.com/dequelabs/axe-core/issues/2239)) ([e69c46a](https://github.com/dequelabs/axe-core/commit/e69c46a49f348b8ae1fec8929e4688940b644a06))
- **has-text-content:** add generic check has-text-content ([#2234](https://github.com/dequelabs/axe-core/issues/2234)) ([60ddc65](https://github.com/dequelabs/axe-core/commit/60ddc6577b70e27e9e7fe340d163b01360035e13))
- **i18n:** add Basque (eu) translation ([#1964](https://github.com/dequelabs/axe-core/issues/1964)) ([176cf82](https://github.com/dequelabs/axe-core/commit/176cf824288a927e5e21dd64a7793251a31ef180))
- **matcher:** allow regex string to be parsed as regex ([#2324](https://github.com/dequelabs/axe-core/issues/2324)) ([321b2d1](https://github.com/dequelabs/axe-core/commit/321b2d1dbfb8f3e04847674f46ada53b19313142))
- **matches:** add explicitRole, implicitRole, and semanticRole matches functions ([#2286](https://github.com/dequelabs/axe-core/issues/2286)) ([30efbff](https://github.com/dequelabs/axe-core/commit/30efbfffc8b83ca03b4b2697e4202027826195f9))
- **matches-definition:** add generic check matches-definition ([#2233](https://github.com/dequelabs/axe-core/issues/2233)) ([20467aa](https://github.com/dequelabs/axe-core/commit/20467aa48705d4b6b98f123031431bb3ac3ee22b))
- **metadata-function-map:** add metadata function map to support check evaulate functions as an id string ([#2162](https://github.com/dequelabs/axe-core/issues/2162)) ([ec9b931](https://github.com/dequelabs/axe-core/commit/ec9b931c3123b3252e3c0afd5b059f0bbcfcc0d0))
- **non-space-content:** switch all non-empty checks to new generic check ([#2215](https://github.com/dequelabs/axe-core/issues/2215)) ([7ce7b00](https://github.com/dequelabs/axe-core/commit/7ce7b00c2d302d830bd2c0efa027d0ea3b10770c))
- **object-alt,accessible-text:** object-alt rule and accessible text to work with serial virtual nodes with children ([e8e17e4](https://github.com/dequelabs/axe-core/commit/e8e17e42c3594518ee60838749a507504a839c69))
- **options:** add ancestry CSS selector to nodes ([#2389](https://github.com/dequelabs/axe-core/issues/2389)) ([f2cccf5](https://github.com/dequelabs/axe-core/commit/f2cccf50def5b2409f5903ce325f18475c8ed79e))
- **region:** add option to match nodes as region ([#2249](https://github.com/dequelabs/axe-core/issues/2249)) ([b544554](https://github.com/dequelabs/axe-core/commit/b544554902b3aa0afb477e5e78140780f42e3405))
- **required-attrs:** deprecate options to pass more required attrs ([797ee34](https://github.com/dequelabs/axe-core/commit/797ee34e6913cc5e45d55c770127e91623cb31f7))
- **rule:** add reviewOnFail option to have rule return as needs review instead of violation ([#2235](https://github.com/dequelabs/axe-core/issues/2235)) ([bb72acd](https://github.com/dequelabs/axe-core/commit/bb72acde17e9f783ac136c30a79f14144326a7df))
- **rule:** optional impact on rules ([#2393](https://github.com/dequelabs/axe-core/issues/2393)) ([e48c1eb](https://github.com/dequelabs/axe-core/commit/e48c1eb67db6182d7048a21f935db5a9416077ec))
- **scope-value:** add options for valid scope values ([#2245](https://github.com/dequelabs/axe-core/issues/2245)) ([44269ec](https://github.com/dequelabs/axe-core/commit/44269ec6695645417dda03b26fcb04abebc15f5f))
- **standards:** add ariaRoles standard ([#2328](https://github.com/dequelabs/axe-core/issues/2328)) ([70efbc0](https://github.com/dequelabs/axe-core/commit/70efbc045448d6621c270e5cbec70fe5794d4216))
- **standards:** add dpub-roles spec ([#2332](https://github.com/dequelabs/axe-core/issues/2332)) ([7ec3185](https://github.com/dequelabs/axe-core/commit/7ec3185d55ca8fdce07c0345f5b960b39a54aba4))
- **standards:** add get-aria-roles-supporting-name-from-content and deprecate aria/get-roles-with-name-from-content ([#2363](https://github.com/dequelabs/axe-core/issues/2363)) ([240b528](https://github.com/dequelabs/axe-core/commit/240b528a3a5e5f06e29973df5a9427315496bd28))
- **standards:** add get-elements-by-content-type and implicit-html-roles ([#2375](https://github.com/dequelabs/axe-core/issues/2375)) ([f1e0848](https://github.com/dequelabs/axe-core/commit/f1e0848cb359f5912e2cf12ada02b06c079d7e21))
- add "ACT" tag for published W3C ACT rules ([#2382](https://github.com/dequelabs/axe-core/issues/2382)) ([cf11b64](https://github.com/dequelabs/axe-core/commit/cf11b646f9b883e153ff5ec8fd848a363ea6bb24))
- **standards:** add html-elms spec ([#2333](https://github.com/dequelabs/axe-core/issues/2333)) ([1d6a888](https://github.com/dequelabs/axe-core/commit/1d6a8885166007f8fec78ce853b8fef8262c522d))
- **standards:** create standards object and ariaAttrs ([#2315](https://github.com/dequelabs/axe-core/issues/2315)) ([48610de](https://github.com/dequelabs/axe-core/commit/48610de74fed473f7d87e3c01f87a46d4dec406c))
- **utils.getFlattenTree:** default to documentElement ([#2260](https://github.com/dequelabs/axe-core/issues/2260)) ([8b14ccc](https://github.com/dequelabs/axe-core/commit/8b14ccc5b1bd89892f57ff0f02de2045e7c3756f))
- **valid-lang:** add option for which attributes to look at ([#2240](https://github.com/dequelabs/axe-core/issues/2240)) ([ffee19e](https://github.com/dequelabs/axe-core/commit/ffee19e4a769d66f9c81016dce83ad654609a9df))
- update SC tags for `label` rule ([#2037](https://github.com/dequelabs/axe-core/issues/2037)) ([c7113fc](https://github.com/dequelabs/axe-core/commit/c7113fcc5d3f144e37d0204eebef701ffc844280))

### Bug Fixes

- **accessible-name-virtual:** allow subtree text to work with virtual and serial nodes ([#2346](https://github.com/dequelabs/axe-core/issues/2346)) ([67d2dca](https://github.com/dequelabs/axe-core/commit/67d2dca91af29a47e85919b049d98a5c83ec5b99))
- **api:** correct use of rules property in axe.run ([#2278](https://github.com/dequelabs/axe-core/issues/2278)) ([1fd9e11](https://github.com/dequelabs/axe-core/commit/1fd9e116598fc2c152a30651110758043fe58ffd))
- **aria-allowed-attr:** Add aria-orientation to radiogroup role ([#2322](https://github.com/dequelabs/axe-core/issues/2322)) ([5e1f922](https://github.com/dequelabs/axe-core/commit/5e1f92206134c81e5c05e907ab3fc1c223243b3d))
- **aria-allowed-attr:** allow aria-activedescendant on role=application ([#2304](https://github.com/dequelabs/axe-core/issues/2304)) ([2554f5c](https://github.com/dequelabs/axe-core/commit/2554f5cdfc7bf616b52f109adedf575c7ea65f65))
- **aria-allowed-role:** Add fieldset to allowed elements for radiogroup ([#2326](https://github.com/dequelabs/axe-core/issues/2326)) ([a5409d4](https://github.com/dequelabs/axe-core/commit/a5409d42deb69ff5982a732a7e947ce97fce9c1e))
- **aria-allowed-role:** allow role=presentation on hr ([#2300](https://github.com/dequelabs/axe-core/issues/2300)) ([b524ea9](https://github.com/dequelabs/axe-core/commit/b524ea954fdcf8fcf09b49bdbe546335ed0e46df))
- **aria-lablledby:** work with virtual and serial virtual nodes ([#2341](https://github.com/dequelabs/axe-core/issues/2341)) ([c1f3db7](https://github.com/dequelabs/axe-core/commit/c1f3db749f8de71635bc378c7cdf1a22c782429a))
- **aria-toggle-field-name:** work with virtual nodes ([#2353](https://github.com/dequelabs/axe-core/issues/2353)) ([e5fb01e](https://github.com/dequelabs/axe-core/commit/e5fb01e497c63c2deca6eebd2466faea4d9afb2a))
- **aria/allowed-attr:** work with standards object ([#2360](https://github.com/dequelabs/axe-core/issues/2360)) ([40397f5](https://github.com/dequelabs/axe-core/commit/40397f560f0bf0bcd7d80b98c4c02857cf6f2584))
- **aria/get-role-type:** work with standards object ([#2361](https://github.com/dequelabs/axe-core/issues/2361)) ([a61e314](https://github.com/dequelabs/axe-core/commit/a61e3142ba5976bde09a9cd82cc944eab5ee284b))
- **autocomplete:** allow all 'tel-*' autocomplete values on type=tel ([#2307](https://github.com/dequelabs/axe-core/issues/2307)) ([58c8175](https://github.com/dequelabs/axe-core/commit/58c8175ce4bcfd597c1d6df4c95113d2eb753951))
- **button-name:** work with serial virtual node ([#2351](https://github.com/dequelabs/axe-core/issues/2351)) ([efa0e56](https://github.com/dequelabs/axe-core/commit/efa0e56ed8901c0d379e564cc0d4d5532b5df547))
- **bypass:** find headings in iframes ([#2310](https://github.com/dequelabs/axe-core/issues/2310)) ([7c23dbd](https://github.com/dequelabs/axe-core/commit/7c23dbd1d04d95e3bd2b56a0bd14571f906eb3d5))
- **color:** allow all valid CSS colors ([#2381](https://github.com/dequelabs/axe-core/issues/2381)) ([63d69ea](https://github.com/dequelabs/axe-core/commit/63d69ea1313d0c7dcdc4142c8de160b89082d9df))
- **color-contrast:** account for text-shadow ([#2334](https://github.com/dequelabs/axe-core/issues/2334)) ([3eb6d2c](https://github.com/dequelabs/axe-core/commit/3eb6d2ccde9dc731450c90ebe497580cb98de201))
- **color-contrast:** ignore aria-disabled labels ([#2130](https://github.com/dequelabs/axe-core/issues/2130)) ([e451b87](https://github.com/dequelabs/axe-core/commit/e451b87166b02262b5f191be1cf9fe1548047931))
- **color-contrast:** properly handle truncated text ([#2302](https://github.com/dequelabs/axe-core/issues/2302)) ([a56190c](https://github.com/dequelabs/axe-core/commit/a56190c845cc7619a38a28685c48d8ac38108ebd))
- **dlitem:** allow role=presentation on parent dl ([#2301](https://github.com/dequelabs/axe-core/issues/2301)) ([9857978](https://github.com/dequelabs/axe-core/commit/9857978a1f926b9eada8f560c9fbb1950fe8c648))
- **focusable-no-name:** work with serial virtual nodes ([#2399](https://github.com/dequelabs/axe-core/issues/2399)) ([1ef3066](https://github.com/dequelabs/axe-core/commit/1ef3066476af80a7b5cb61a8fcb113f0208d5086))
- **forms/*:** allow all form control value checks to work with virtual nodes ([#2343](https://github.com/dequelabs/axe-core/issues/2343)) ([8ad41af](https://github.com/dequelabs/axe-core/commit/8ad41af457125a268256f84de7623a79e905f782))
- **header-present:** fail for headings with non-header role ([#2306](https://github.com/dequelabs/axe-core/issues/2306)) ([b8ffb39](https://github.com/dequelabs/axe-core/commit/b8ffb39785188dd230431f4f53825f1fe42ee3af))
- **html-namespace-matches:** work with serial virtual nodes ([#2398](https://github.com/dequelabs/axe-core/issues/2398)) ([18c22fd](https://github.com/dequelabs/axe-core/commit/18c22fd379440eb681aa18cf0b624d6b4b3cbeec))
- **implicit-roles:** add proper implicit role calculation ([#2242](https://github.com/dequelabs/axe-core/issues/2242)) ([e9dd259](https://github.com/dequelabs/axe-core/commit/e9dd2598b469fcbf936517aba33f983191301ff9))
- **input-button-name:** work with virtual nodes ([#2352](https://github.com/dequelabs/axe-core/issues/2352)) ([63ca388](https://github.com/dequelabs/axe-core/commit/63ca3881e8352fba3b71f2f76dae23a0d70a271f))
- **is-valid-autocomplete:** allow autocomplete="one-time-code" ([#2336](https://github.com/dequelabs/axe-core/issues/2336)) ([638346f](https://github.com/dequelabs/axe-core/commit/638346fc515cfa5fda1b71f5ad31f5d4436a21eb))
- **label:** work with virtual nodes ([#2354](https://github.com/dequelabs/axe-core/issues/2354)) ([44b033c](https://github.com/dequelabs/axe-core/commit/44b033c51619294a8d85c26aa6c703f57db90a59))
- **page-has-h1:** allow aria-level=1 on native headings ([#2349](https://github.com/dequelabs/axe-core/issues/2349)) ([70b10b2](https://github.com/dequelabs/axe-core/commit/70b10b29c725507b0c1b6fb0d6d4146f123e5d34))
- **rule:** allow impact to be configured ([#2426](https://github.com/dequelabs/axe-core/issues/2426)) ([f325c75](https://github.com/dequelabs/axe-core/commit/f325c755a11895cbb868de7be648461e5d81494e))
- **rule,check:** allow function ids for matches property in rule.configure ([#2423](https://github.com/dequelabs/axe-core/issues/2423)) ([3ccb781](https://github.com/dequelabs/axe-core/commit/3ccb78128469d234db22225ea93a40c6d8fef434))
- **run:** cleanup globals if set from context ([#2387](https://github.com/dequelabs/axe-core/issues/2387)) ([d5b6931](https://github.com/dequelabs/axe-core/commit/d5b6931cba857a5c787d912ee56bdd973e3742d4))
- **svg-image-alt:** work with serial virtual nodes ([#2397](https://github.com/dequelabs/axe-core/issues/2397)) ([e2537ef](https://github.com/dequelabs/axe-core/commit/e2537eff1eb4b5378d63bddf00df44347d3aa09b))
- **types:** Allow `impact` to be `null` ([#2321](https://github.com/dequelabs/axe-core/issues/2321)) ([757aacd](https://github.com/dequelabs/axe-core/commit/757aacd9716dc8a606f23807a5e8fe6a5474fbee)), closes [#2313](https://github.com/dequelabs/axe-core/issues/2313)
- **types:** Make any tag allowed ([#2314](https://github.com/dequelabs/axe-core/issues/2314)) ([5d98a04](https://github.com/dequelabs/axe-core/commit/5d98a043d8bcda3a3fe032dd8205c9256c481631)), closes [#2312](https://github.com/dequelabs/axe-core/issues/2312)
- **typings:** update types file ([#2425](https://github.com/dequelabs/axe-core/issues/2425)) ([0aab922](https://github.com/dequelabs/axe-core/commit/0aab922630bf72cc658dee3fb907463d718c57f1))
- **virtual-node:** default and lowercase type property ([#2350](https://github.com/dequelabs/axe-core/issues/2350)) ([f6b3484](https://github.com/dequelabs/axe-core/commit/f6b34849fd0d869448137b4d032ca69a91fa9f66))
- ensure correctly generated axe is required by `aria-supported` build step ([#2295](https://github.com/dequelabs/axe-core/issues/2295)) ([1414a9f](https://github.com/dequelabs/axe-core/commit/1414a9fd822700609024aa2cef782d63cfb0bce4))
- **aria-required-attr:** pass aria-checked for elements with checked property ([#2226](https://github.com/dequelabs/axe-core/issues/2226)) ([64318a5](https://github.com/dequelabs/axe-core/commit/64318a5bce02f05c6e6a1acf739c354b84b88082))
- **axe.d.ts:** add `element` to NodeResults ([#2211](https://github.com/dequelabs/axe-core/issues/2211)) ([2429355](https://github.com/dequelabs/axe-core/commit/242935552c1679f0c98aff8585fd39c0442d2d6e))
- **color-contrast:** mark more punctutions for review ([#2126](https://github.com/dequelabs/axe-core/issues/2126)) ([dc98afc](https://github.com/dequelabs/axe-core/commit/dc98afc841c86e4b7b771bbb1171152a151c3e5b))
- **duplicate-id:** list the duplicate id in message ([#2163](https://github.com/dequelabs/axe-core/issues/2163)) ([f5d4ff9](https://github.com/dequelabs/axe-core/commit/f5d4ff9e792b979c7f7c7cf8b3607f3969c25eb4))
- **required-children:** consider overriding descendant role(s)… ([#2131](https://github.com/dequelabs/axe-core/issues/2131)) ([e1c11dd](https://github.com/dequelabs/axe-core/commit/e1c11ddf6e001eaa593a477eb7a5cb2f3c020e6d))
- **scrollable-region-focusable:** pass for elements with contenteditable ([#2133](https://github.com/dequelabs/axe-core/issues/2133)) ([1012dfe](https://github.com/dequelabs/axe-core/commit/1012dfec29a7a69b70357211233bb350159fa83e))
- **th-has-data-cells:** fail when only cell points to different header ([2d420c3](https://github.com/dequelabs/axe-core/commit/2d420c33981231a21d375c0aa8907e0c4c7c8932))
- **types:** Add "wcag21aa" and "wcag21a" to our TS definition ([#2272](https://github.com/dequelabs/axe-core/issues/2272)) ([23674d4](https://github.com/dequelabs/axe-core/commit/23674d4403a7088996a758d0081b869516be4aea))
- **types:** Add missing properties to `Spec` ([#2273](https://github.com/dequelabs/axe-core/issues/2273)) ([c39ba9f](https://github.com/dequelabs/axe-core/commit/c39ba9ffbd3a9777660da1d7e27d2471fc4158cd))
```
