### Symbol.getDocumentationComment — retrieves full documentation comment as plain text

Source: https://github.com/microsoft/typescript/blob/main/packages/typescript/src/api/sync/api.ts

Returns the full JSDoc comment of a symbol (without tags) as a plain string, deduplicated across declarations. Called via `symbol.getDocumentationComment(checker)`.

```typescript
get getDocumentationComment(): {
    (checker: Checker): string;
    gen(checker: Checker): Generator<ProtocolRequest, string, ProtocolResponse["result"]>;
} {
    const owner = this;
    return cacheGeneratorMethod(
        owner,
        "getDocumentationComment",
        function (checker: Checker): string {
            return checker.getDocumentationCommentOfSymbol(owner);
        },
        function* (checker: Checker): Generator<ProtocolRequest, string, ProtocolResponse["result"]> {
            return yield* checker.getDocumentationCommentOfSymbol.gen(owner);
        },
    );
}
```

--------------------------------

### GetSymbolDocumentationComment — Go backend implementation rendering documentation as plain text

Source: https://github.com/microsoft/typescript/blob/main/tsc/internal/ls/jsdoc.go

Gathers JSDoc comment text from each unique declaration, deduplicates, and joins with newlines. Backs Symbol.getDocumentationComment.

```go
func GetSymbolDocumentationComment(c *checker.Checker, symbol *ast.Symbol) string {
	if symbol == nil {
		return ""
	}
	var parts []string
	var seen collections.Set[*ast.Node]
	for _, decl := range symbol.Declarations {
		if decl == nil {
			continue
		}
		if !seen.AddIfAbsent(decl) {
			continue
		}
		if doc := getDocumentationFromDeclaration(noMappedLocation, c, symbol, decl, decl, lsproto.MarkupKindPlainText, true /*commentOnly*/); doc != "" && !slices.Contains(parts, doc) {
			parts = append(parts, doc)
		}
	}
	return strings.Join(parts, "\n")
}
```

--------------------------------

### Exported API with JSDoc documentation

Source: https://github.com/microsoft/typescript/blob/main/tsc/testdata/tests/cases/conformance/jsdoc/declarations/jsDeclarationsFunctionJSDoc.ts

Demonstrates best practices for documenting exported functions, classes, and constants using JSDoc `@param`, `@returns`, and class/method-level docs with no external dependencies.

```typescript
/**
 * Foos a bar together using an `a` and a `b`
 * @param {number} a
 * @param {string} b
 */
export function foo(a, b) {}

/**
 * Legacy - DO NOT USE
 */
export class Aleph {
    /**
     * Impossible to construct.
     * @param {Aleph} a
     * @param {null} b
     */
    constructor(a, b) {
        /**
         * Field is always null
         */
        this.field = b;
    }

    /**
     * Doesn't actually do anything
     * @returns {void}
     */
    doIt() {}
}

/**
 * Not the speed of light
 */
export const c = 12;
```

--------------------------------

### AbortController API documentation (JSDoc)

Source: https://github.com/microsoft/typescript/blob/main/tsc/internal/bundled/libs/lib.dom.d.ts

Complete JSDoc-annotated interface definition for AbortController from TypeScript's bundled DOM library, including documentation for the `signal` property and `abort()` method with MDN references.

```typescript
/**
 * The **`AbortController`** interface represents a controller object that allows you to abort one or more Web requests as and when desired.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController)
 */
interface AbortController {
    /**
     * The **`signal`** read-only property of the AbortController interface returns an AbortSignal object instance, which can be used to communicate with/abort an asynchronous operation as desired.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/signal)
     */
    readonly signal: AbortSignal;
    /**
     * The **`abort()`** method of the AbortController interface aborts an asynchronous operation before it has completed. This is able to abort fetch requests, the consumption of any response bodies, or streams.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/abort)
     */
    abort(reason?: any): void;
}

declare var AbortController: {
    prototype: AbortController;
    new(): AbortController;
};
```

### VSDoc

Source: https://github.com/microsoft/typescript/wiki/JavaScript-Language-Service-in-Visual-Studio

XML documentation comments, known as VSDoc, are no longer supported for enhancing IntelliSense results. The new language service favors JSDoc, which is an easier-to-write and widely accepted standard for JavaScript documentation.
