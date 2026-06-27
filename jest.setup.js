import '@testing-library/jest-dom'

global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add any custom Jest matchers if needed
// Example:
// expect.extend({
//   toBeWithinRange(received, floor, ceiling) {
//     const pass = received >= floor && received <= ceiling;
//     return {
//       message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
//       pass: pass,
//     };
//   },
// });

// Configure Jest timeout if needed
// jest.setTimeout(10000);