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

--------------------------------

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

### Incremental program watcher — watch mode with strategy conventions

Source: https://github.com/microsoft/typescript/blob/main/tsc/testdata/tests/cases/compiler/APISample_Watch.ts

Official API sample showing watch mode with inline documentation of conventions for program creation strategies: createEmitAndSemanticDiagnosticsBuilderProgram (incremental re-check + emit), createSemanticDiagnosticsBuilderProgram (type-check only), and createAbstractBuilder (full check). Documents when to use each.

```typescript
import ts = require("typescript");

const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
}

function watchMain() {
    const configPath = ts.findConfigFile(/*searchPath*/ "./", ts.sys.fileExists, "tsconfig.json");
    if (!configPath) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    // TypeScript can use several different program creation "strategies":
    //  * ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    //  * ts.createSemanticDiagnosticsBuilderProgram
    //  * ts.createAbstractBuilder
    // The first two produce "builder programs". These use an incremental strategy to only re-check and emit files whose
    // contents may have changed, or whose dependencies may have changes which may impact change the result of prior type-check and emit.
    // The last uses an ordinary program which does a full type check after every change.
    // Between `createEmitAndSemanticDiagnosticsBuilderProgram` and `createSemanticDiagnosticsBuilderProgram`, the only difference is emit.
    // For pure type-checking scenarios, or when another tool/process handles emit, using `createSemanticDiagnosticsBuilderProgram` may be more desirable.

    // Note that there is another overload for `createWatchCompilerHost` that takes a set of root files.
    const host = ts.createWatchCompilerHost(configPath, {}, ts.sys,
        ts.createSemanticDiagnosticsBuilderProgram,
        reportDiagnostic,
        reportWatchStatusChanged,
    );

    // You can technically override any given hook on the host, though you probably don't need to.
    // Note that we're assuming `origCreateProgram` and `origPostProgramCreate` doesn't use `this` at all.
    const origCreateProgram = host.createProgram;
    host.createProgram = (rootNames: ReadonlyArray<string> | undefined, options, host, oldProgram) => {
        console.log("** We're about to create the program! **");
        return origCreateProgram(rootNames, options, host, oldProgram);
    }
    const origPostProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = program => {
        console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };

    // `createWatchProgram` creates an initial program, watches files, and updates the program over time.
    ts.createWatchProgram(host);
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
    console.error("Error", diagnostic.code, ":",
        ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine())
    );
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

watchMain();
```

### VSDoc

Source: https://github.com/microsoft/typescript/wiki/JavaScript-Language-Service-in-Visual-Studio

XML documentation comments, known as VSDoc, are no longer supported for enhancing IntelliSense results. The new language service favors JSDoc, which is an easier-to-write and widely accepted standard for JavaScript documentation.
