import { addTimestampToResponse } from '../../../service-worker.js'; // Use .js as it will be compiled

// Mock global Response and Headers for the test environment
// These are simplified mocks focusing on what addTimestampToResponse uses.
const mockResponse = jest.fn((body, init) => ({
  body,
  headers: new Headers(init?.headers),
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  clone: jest.fn().mockImplementation(function(this: Response) { // Explicitly type 'this'
    return { // Return a new object that mimics the cloned response
        body: this.body,
        headers: new Headers(this.headers), // Create new Headers from existing
        status: this.status,
        statusText: this.statusText,
        clone: this.clone // Keep the clone method if needed further
    };
  })
}));

const mockHeaders = jest.fn((init?: HeadersInit) => {
  const headers = new Map<string, string>();
  if (init) {
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => headers.set(key.toLowerCase(), value));
    } else if (typeof init === 'object' && Symbol.iterator in init) {
        for (const [key, value] of init as Iterable<[string, string]>) {
            headers.set(key.toLowerCase(), value);
        }
    } else { // HeadersInit is Record<string, string>
      for (const key in init as Record<string, string>) {
        headers.set(key.toLowerCase(), (init as Record<string, string>)[key]);
      }
    }
  }
  return {
    append: jest.fn((key: string, value: string) => headers.set(key.toLowerCase(), value)),
    get: jest.fn((key: string) => headers.get(key.toLowerCase()) || null),
    has: jest.fn((key: string) => headers.has(key.toLowerCase())),
    forEach: jest.fn((callback) => headers.forEach(callback)) // Added for clone
  };
});

global.Response = mockResponse as any;
global.Headers = mockHeaders as any;


describe('Service Worker Utilities', () => {
  
  beforeEach(() => {
    // Clear mocks before each test if they accumulate state (though these are simple)
    mockResponse.mockClear();
    mockHeaders.mockClear();
    // Reset any internal state of mocks if necessary
    // For example, if mockHeaders's internal map should be cleared:
    // This requires exposing a clear method on the mock or re-instantiating it.
    // For simplicity here, we assume each call to `new Headers()` in the SUT creates a fresh one.
  });

  describe('addTimestampToResponse', () => {
    let dateNowSpy: jest.SpyInstance<number, []>;

    beforeEach(() => {
      // Mock Date.now to return a fixed timestamp
      dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1678886400000);
    });

    afterEach(() => {
      // Restore original Date.now
      dateNowSpy.mockRestore();
    });

    test('should return the original response if response or response.body is null', () => {
      const nullResponse = null as any as Response;
      expect(addTimestampToResponse(nullResponse)).toBeNull();

      const responseNoBody = { body: null } as Response;
      expect(addTimestampToResponse(responseNoBody)).toEqual(responseNoBody);
    });

    test('should add a "sw-cache-timestamp" header to the response', () => {
      const originalHeaders = new Headers();
      originalHeaders.append('X-Test', 'test-value');
      const mockBody = new ReadableStream();
      const originalResponse = new Response(mockBody, { headers: originalHeaders });
      
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now); // Mock Date.now()

      const newResponse = addTimestampToResponse(originalResponse);

      expect(newResponse.headers.has('sw-cache-timestamp')).toBe(true);
      expect(newResponse.headers.get('sw-cache-timestamp')).toBe(now.toString());
      
      // Check that original headers are preserved
      expect(newResponse.headers.get('x-test')).toBe('test-value'); 
      
      // Check that a new Response object is created
      expect(newResponse).not.toBe(originalResponse);
      expect(originalResponse.clone).toHaveBeenCalled(); // Ensure clone was called on the original

      // Date.now.mockRestore(); // Restore original Date.now
      dateNowSpy.mockRestore(); // Use the spy's mockRestore
    });

    test('should preserve original status and statusText', () => {
      const originalResponse = new Response('test body', { status: 202, statusText: 'Accepted' });
      const newResponse = addTimestampToResponse(originalResponse);
      expect(newResponse.status).toBe(202);
      expect(newResponse.statusText).toBe('Accepted');
    });

    test('should work with empty initial headers', () => {
        const originalResponse = new Response('test body');
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const newResponse = addTimestampToResponse(originalResponse);
        expect(newResponse.headers.has('sw-cache-timestamp')).toBe(true);
        expect(newResponse.headers.get('sw-cache-timestamp')).toBe(now.toString());
        dateNowSpy.mockRestore();
    });

    test('should not modify headers if X-Timestamp is already present', async () => {
      const existingTimestamp = '1678886000000';
      const request = new Request('/');
      const originalResponse = new Response('Hello world', {
        headers: { 'X-Timestamp': existingTimestamp }
      });

      // No need to spy here, it's done in beforeEach
      // const dateNowSpy = jest.spyOn(Date, 'now');

      const response = await addTimestampToResponse(originalResponse.clone());
      const headers = Object.fromEntries(response.headers.entries());

      expect(headers['x-timestamp']).toBe(existingTimestamp);
      expect(dateNowSpy).not.toHaveBeenCalled();

      // No need to restore here, it's done in afterEach
      // dateNowSpy.mockRestore(); 
    });

    test('should handle responses with no pre-existing headers correctly', async () => {
        const request = new Request('/');
        const originalResponse = new Response('Hello world'); // No headers object initially
        
        // No need to spy here, it's done in beforeEach
        // const dateNowSpy = jest.spyOn(Date, 'now');
        // dateNowSpy.mockReturnValue(1678886400000); 

        const response = await addTimestampToResponse(originalResponse.clone());
        const headers = Object.fromEntries(response.headers.entries());

        expect(headers['x-timestamp']).toBe('1678886400000');
        expect(dateNowSpy).toHaveBeenCalled();
        
        // No need to restore here, it's done in afterEach
        // dateNowSpy.mockRestore(); 
    });
  });
});

// Minimalistic mock for Jest-like functions if not running in Jest
// if (typeof describe === 'undefined') {
//     global.describe = (name, fn) => fn();
//     global.test = (name, fn) => fn();
//     global.expect = (val) => ({
//         toBe: (exp) => { if (val !== exp) throw new Error(`Expected ${val} to be ${exp}`); },
//         toEqual: (exp) => { if (JSON.stringify(val) !== JSON.stringify(exp)) throw new Error(`Expected ${JSON.stringify(val)} to equal ${JSON.stringify(exp)}`); },
//         toHaveProperty: (prop) => { if (typeof val !== 'object' || !val.hasOwnProperty(prop)) throw new Error(`Expected ${val} to have property ${prop}`);},
//         not: { toBe: (exp) => { if (val === exp) throw new Error(`Expected ${val} not to be ${exp}`); } },
//     });
// }
