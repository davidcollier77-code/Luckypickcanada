# Docs & examples for your agent

Motion+ (paid). Best practices (the free /motion skill, https://github.com/motiondivision/ai-kit) and documentation search are free. Example and Motion UI source need Motion+, through the Motion+ MCP server. Setup: https://motion.dev/docs/ai-kit-install. Give your AI editor always-current Motion docs to search, plus source code for every premium example on Motion+.

Agents have supercharged our development workflows, but even now they still struggle to produce great animation code.

For example, have you ever fought with your agent about still importing Motion from `"framer-motion"`? This is because it's trained on out-of-date information.

Or has it produced an animation that's **almost** right but ends up requiring a lot of prompting to fix? This is because agents can't visualise timing or easing curves, so they guess at values that often feel wrong.

The [Motion AI Kit](https://motion.dev/docs/ai-kit) gives your agent the right information at the right time, using:

- **Motion documentation:** the full, current docs, searchable by your agent.

- **Example source code:** every premium [example](https://motion.dev/examples) from [Motion+](https://motion.dev/plus).

- **Your saved transitions:** anything transition build in the [transition editor](https://motion.dev/docs/ai-kit-transition-editor).

- **Best practises:** Handwritten animation tips by the Motion team. Free and open source.

In short, it turns your AI editor into a Motion expert.

## Documentation

The [AI Kit MCP](https://motion.dev/docs/ai-kit-install) includes the full, up-to-date Motion documentation. Every docs page is available as an MCP resource, and your agent can search across them using the built-in search tool.

This ensures your agent is working with the latest information, not missing or out-of-date training data.

```
/motion eli5 on useTransform
```

## Examples

[Motion+](https://motion.dev/plus) adds a vault of premium examples, all available to your agent via the MCP.

Instead of inventing patterns, your agent searches this curated collection of production-ready examples and adapts them to your project. It's as easy as "build me an accordion", or "create a vertically scrolling Carousel".

- **Zero hallucinations:** The code comes from the official Motion repository, not a generic LLM training set.

- **Context aware:** The agent reads the example code and understands **why** it works, allowing it to adapt the variables to your specific project names automatically.

### Adapt a specific example

Use prompts like:

```
create a tooltip with Motion and Base UI
```

Or:

```
make a spinning 3d cube
```

All examples are browsable via the [Motion Examples](https://motion.dev/examples) gallery, so it's easy to ask your editor to add a specific one:

The AI Kit transition editor can be save transitions to your Motion+ profile. These are all available to your agent via the MCP.

```
adapt the app store motion example
```

The AI editor will, by default, select between JS, React and Vue based on your project. You can manually prompt it for a specific platform by mentioning it directly.

```
adapt the app store motion vue example 
```

## Saved transitions

These shared transitions can be accessed via your agent.

![](https://images.motion.dev/docs/oPaAY4CgzAPqiavIFf8lJrAOQ.png)

On a user's profile, you can save their shared transitions to your own profile, too.

![](https://images.motion.dev/docs/wKYJoItcmwtaOYGQtV9eZFbs.png)

Turn your agent into an animation expert with [Motion+](https://motion.dev/plus), which also includes Motion UI, the full examples library, step-by-step tutorials, and early access to new features.

```
use my "bounce out" transition
```

## Best practises

The AI Kit installs a `/motion` skill: handwritten animation rules straight from the Motion team. It detects your platform and any UI libraries, and applies the correct guidance.

The skill is free and open source (MIT), and needs no account. Its source is on GitHub at [motiondivision/ai-kit](https://github.com/motiondivision/ai-kit).

For instance, it will know which values the browser can animate on the GPU, like `transform`, `opacity` and `filter`, and which trigger layout or paint. Or what tone of animation to use based on the intended audience of the project.

The result is animation code that feels considered, performs well, and needs far less back and forth to get right.

## Get the AI Kit

Stop fighting your AI over animation code. Best practices and documentation search are free. The rest of the Motion AI Kit is included with [Motion+](https://motion.dev/plus), along with Motion UI, the full examples library, step-by-step tutorials, and early access to new features.
