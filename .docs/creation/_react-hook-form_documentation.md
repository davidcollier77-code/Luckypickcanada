### Documentation content pipeline

Source: https://github.com/react-hook-form/documentation/blob/master/contentlayer.config.ts

Defines the Doc document type backed by MDX files under src/content/, which together constitute the full documentation. All docs are authored as MDX with a title, description, and sidebar reference, then compiled at build time by Contentlayer.

```typescript
export const Doc = defineDocumentType(() => ({
  name: "Doc",
  contentType: "mdx",
  filePathPattern: "**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    metaDescription: { type: "string", required: false },
    sidebar: {
      type: "enum",
      options: [
        "apiLinks",
        "advancedLinks",
        "tsLinks",
        "faqLinks",
        "getStartedLinks",
        "migrateV7ToV8Links",
      ],
      required: true,
    },
  },
}))

export default makeSource({
  contentDirPath: "src/content",
  documentTypes: [Doc],
})
```

--------------------------------

### API documentation overview

Source: https://github.com/react-hook-form/documentation/blob/master/src/components/ApiGallery.tsx

The API gallery page listing every documented hook and component: useForm, useController, useFormContext, useWatch, useFormState, useFieldArray, useLens, and createFormControl — the complete API reference surface of the documentation.

```typescript
export default function ApiGallery() {
  return (
    <main className={styles.root}>
      <ul className={styles.gallery}>
        <li><div><h3><code>{`</>`}</code>useForm</h3><p>A powerful custom hook to validate your form with minimal re-renders.</p><Link href="/docs/useform">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useController</h3><p>For Controlled components: interface with the useForm methods and isolate its re-render.</p><Link href="/docs/usecontroller">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useFormContext</h3><p>Access your useForm methods and properties from nested components.</p><Link href="/docs/useformcontext">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useWatch</h3><p>Subscribe to individual form input changes without impacting the root component's render.</p><Link href="/docs/usewatch">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useFormState</h3><p>Subscribe to individual form state updates and isolating re-renders at the hook level.</p><Link href="/docs/useformstate">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useFieldArray</h3><p>Manage dynamically generated fields on the fly, shuffle, remove and append fields.</p><Link href="/docs/usefieldarray">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>useLens</h3><p>Type-safe lenses for building reusable and shareable form components with precise focus on form fields.</p><Link href="/docs/uselens">Read More ▸</Link></div></li>
        <li><div><h3><code>{`</>`}</code>createFormControl</h3><p>Create form control object and subscribe form state outside of React component.</p><Link href="/docs/createFormControl">Read More ▸</Link></div></li>
      </ul>
    </main>
  )
}
```

--------------------------------

### get-started Quickstart Example

Source: https://github.com/react-hook-form/documentation/blob/master/src/content/get-started.mdx

The primary 'Get Started' example from the documentation site, showing the full basic usage of React Hook Form with TypeScript (register, handleSubmit, watch, formState, errors).

```typescript
import { useForm, SubmitHandler } from "react-hook-form"

type Inputs = {
  example: string
  exampleRequired: string
}

export default function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data)

  console.log(watch("example")) // watch input value by passing its name

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      <input defaultValue="test" {...register("example")} />

      {/* include validation with required or other standard HTML validation rules */}
      <input {...register("exampleRequired", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}

      <input type="submit" />
    </form>
  )
}
```

--------------------------------

### useForm Configuration Options

Source: https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx

Configuration properties for the useForm hook to manage form state, validation, and external data synchronization.

```APIDOC
## useForm Configuration

### values (FieldValues)
- **Description**: Reacts to changes and updates form values. Useful for external state or server data synchronization.
- **Note**: Overwrites defaultValues unless resetOptions is configured.

### errors (FieldErrors)
- **Description**: Reacts to changes and updates server-side error states.

### resetOptions (KeepStateOptions)
- **Description**: Configures behavior when values or defaultValues are updated asynchronously. References the reset method options.
- **Fields**:
  - keepDirtyValues (boolean): Retains user-interacted values.
  - keepErrors (boolean): Retains existing errors.

### context (object)
- **Description**: A mutable object injected into the resolver's second argument or validation context.

### criteriaMode ('firstError' | 'all')
- **Description**: Determines how validation errors are gathered. 'firstError' (default) gathers only the first error per field; 'all' gathers all errors.

### shouldFocusError (boolean)
- **Description**: When true (default), focuses the first field with an error upon failed submission. Requires the field ref to be attached to a DOM element.
```

--------------------------------

### useController(props: UseControllerProps)

Source: https://github.com/react-hook-form/documentation/blob/master/src/content/docs/usecontroller.mdx

A custom hook that powers the Controller component, enabling the creation of reusable controlled inputs with full form state access.

```APIDOC
## useController(props: UseControllerProps)

### Description
This custom hook is used to build reusable controlled inputs. It provides access to the field's value, validation state, and overall form state.

### Parameters
- **name** (FieldPath) - Required - Unique name of your input. Reactive — the controller re-subscribes when this prop changes.
- **control** (Control) - Optional - The control object provided by invoking useForm. Optional when using FormProvider.
- **rules** (Object) - Optional - Validation rules including required, min, max, minLength, maxLength, pattern, and validate.
```
