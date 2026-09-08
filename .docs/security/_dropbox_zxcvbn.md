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

### Analyze password and estimate crack times

Source: https://github.com/dropbox/zxcvbn/blob/master/_autodocs/api-reference/time_estimates.md

A complete workflow demonstrating password matching, scoring, and time estimation.

```javascript
const scoring = require('./scoring');
const time_estimates = require('./time_estimates');
const matching = require('./matching');

// Analyze a password
const password = 'Tr0ub4dour&3';
const matches = matching.omnimatch(password);
const result = scoring.most_guessable_match_sequence(password, matches);

// Convert guesses to times and score
const estimate = time_estimates.estimate_attack_times(result.guesses);

console.log('Guesses:', result.guesses);                // e.g., 10^12
console.log('Guesses (log10):', result.guesses_log10); // 12

console.log('Score:', estimate.score);                 // 4

console.log('Crack times (seconds):');
console.log('  Online (throttled):', estimate.crack_times_seconds.online_throttling_100_per_hour);
console.log('  Online (no throttle):', estimate.crack_times_seconds.online_no_throttling_10_per_second);
console.log('  Offline (slow hash):', estimate.crack_times_seconds.offline_slow_hashing_1e4_per_second);
console.log('  Offline (fast hash):', estimate.crack_times_seconds.offline_fast_hashing_1e10_per_second);

console.log('Crack times (display):');
console.log('  Online (throttled):', estimate.crack_times_display.online_throttling_100_per_hour);
// "centuries"
console.log('  Offline (fast):', estimate.crack_times_display.offline_fast_hashing_1e10_per_second);
// "less than a second"
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
