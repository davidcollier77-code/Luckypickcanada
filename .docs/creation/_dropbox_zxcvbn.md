### zxcvbn(password, user_inputs = [])

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/README.md

The main entry point for the library. It evaluates the strength of a given password and returns a comprehensive result object containing scores, crack time estimates, and feedback.

```APIDOC
## zxcvbn(password, user_inputs = [])

### Description
Evaluates the strength of a password and returns an object containing the score, crack time estimates, and suggestions for improvement.

### Parameters
- **password** (string) - Required - The password to evaluate.
- **user_inputs** (string[]) - Optional - An array of strings to be excluded from the password (e.g., username, email).

### Returns
- **password** (string) - The input password.
- **guesses** (number) - Estimated number of guesses to crack the password.
- **guesses_log10** (number) - Log10 of the estimated guesses.
- **sequence** (Match[]) - Array of detected patterns.
- **crack_times_seconds** (object) - Estimated crack times in seconds for various attack scenarios.
- **crack_times_display** (object) - Human-readable crack times.
- **score** (number) - Strength score from 0 to 4.
- **feedback** (object) - Contains warning and suggestions.
- **calc_time** (number) - Time taken to calculate the result.
```

--------------------------------

### Complete Feedback Usage Examples

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/api-reference/feedback.md

Provides comprehensive examples for handling weak, strong, keyboard-based, and repeated-character passwords.

```javascript
const zxcvbn = require('zxcvbn');

// Weak password
const result1 = zxcvbn('password123');
console.log(result1.score);           // 0
console.log(result1.feedback.warning);
// "This is a top-10 common password"
console.log(result1.feedback.suggestions);
// [
//   "Add another word or two. Uncommon words are better.",
//   "Capitalization doesn't help very much"
// ]

// Strong password
const result2 = zxcvbn('correct horse battery staple');
console.log(result2.score);           // 4
console.log(result2.feedback.warning);
// ""
console.log(result2.feedback.suggestions);
// []

// Keyboard pattern
const result3 = zxcvbn('qwerty');
console.log(result3.score);           // 1
console.log(result3.feedback.warning);
// "Straight rows of keys are easy to guess"
console.log(result3.feedback.suggestions);
// [
//   "Add another word or two. Uncommon words are better.",
//   "Use a longer keyboard pattern with more turns"
// ]

// Repeat pattern
const result4 = zxcvbn('aaaaaa');
console.log(result4.score);           // 0
console.log(result4.feedback.warning);
// "Repeats like \"aaa\" are easy to guess"
console.log(result4.feedback.suggestions);
// [
//   "Add another word or two. Uncommon words are better.",
//   "Avoid repeated words and characters"
// ]
```

### Document Metrics

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/INDEX.md

The zxcvbn documentation is organized into several key areas including a main guide, detailed API references for matching, scoring, time estimates, and feedback, as well as supplementary guides for patterns and configuration. The project encompasses nearly 4,000 lines of documentation to support developers in understanding password analysis, guess calculation, and integration.

--------------------------------

### Document Overview > README.md

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/INDEX.md

The README serves as the primary entry point for zxcvbn documentation, providing an overview of key features, module dependencies, installation instructions, performance considerations, and security guidance.

--------------------------------

### Quick Navigation > By Use Case

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/INDEX.md

Users can navigate the documentation based on specific goals. For general understanding, the README and main API reference are primary resources. Password analysis and guess calculation logic are detailed in the patterns, matching, and scoring documents. Integration tasks such as adding custom dictionaries, UI implementation, and testing are supported by the configuration, feedback, and types documentation.
