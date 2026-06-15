// Re-export the native global DOMException constructor provided by modern Node.js v17+
// Fallback to standard Error if not available
module.exports = globalThis.DOMException || Error;
