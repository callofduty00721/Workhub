// Every list/search endpoint builds a case-insensitive "contains" filter by
// passing raw user input straight into `new RegExp(input, "i")`. Two real
// problems with that:
//
// 1. ReDoS — a regex isn't just a string match, it's a pattern the input
//    itself can shape. A crafted value like "(a+)+$" or "(a|a)*b" compiles
//    into a pattern with catastrophic backtracking, and MongoDB evaluates
//    $regex/$or filters synchronously in-process — a single request with
//    one of these as `?search=` can pin a CPU core and stall the event loop
//    for every other request, on an otherwise fully public, unauthenticated
//    endpoint (marketplace search boxes). This is what actually causes an
//    outage, not just a slow query.
// 2. Regex metacharacters (`.`, `*`, `(`, `|`, ...) in a name/location a user
//    types are meant to be searched literally, not interpreted — searching
//    "C++." should look for the literal string, not "C" followed by any two
//    characters and any character.
//
// `escapeRegexInput` neutralizes both: every regex metacharacter in the raw
// string is escaped so the resulting pattern can only ever match itself
// literally, and length is capped so an absurdly long input can't blow up
// matching time on its own even after escaping. Every existing `new
// RegExp(userInput, ...)` call site should pass through this first — the
// call sites themselves don't change shape, just what they feed in.
const MAX_SEARCH_INPUT_LENGTH = 200;

export function escapeRegexInput(input) {
  return String(input).slice(0, MAX_SEARCH_INPUT_LENGTH).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Convenience wrapper for the extremely common `new RegExp(escapeRegexInput(x), "i")`
// pattern — same result, less repetition at each of the ~20 call sites.
export function safeSearchRegex(input, flags = "i") {
  return new RegExp(escapeRegexInput(input), flags);
}
