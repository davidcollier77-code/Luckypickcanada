# Performance: Replace closures with classic for-loops in drawBranch
We want to optimize drawing lighting bolts on the Lucky Meter generator. Instead of allocating closure variables and functions through `.forEach` loops, use classic `for` loops in hot code paths like `drawBranch` to improve frames-per-second and reduce CPU overhead.
