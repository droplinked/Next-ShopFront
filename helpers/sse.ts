import type { Page } from '@playwright/test';

/**
 * Server-Sent Events (SSE) test helpers.
 *
 * SSE streams are common for live state push (playback state, notifications,
 * collaborative cursors). Don't make tests depend on the real SSE endpoint —
 * intercept and inject synthetic events on demand.
 *
 * Pattern:
 *   1. Install the interceptor BEFORE navigation
 *   2. Navigate; the app opens its EventSource and hits the mock
 *   3. Push synthetic events with pushEvent()
 *   4. Assert UI reaction
 */

export interface SseInterceptor {
  /**
   * Push a synthetic SSE event into all listeners on the page.
   * Mirrors the browser's EventSource event delivery contract.
   */
  pushEvent: (event: { name?: string; data: unknown; id?: string }) => Promise<void>;
  /**
   * Close all open SSE streams (simulates server-side close or net failure).
   */
  closeAll: () => Promise<void>;
}

/**
 * Intercept any EventSource opened during the page's lifetime and route it
 * through a controlled in-page bus instead of hitting the network.
 *
 * Pass a URL pattern (string substring or RegExp) to scope which streams
 * get intercepted. Omit to intercept all EventSource opens.
 */
export async function interceptSse(
  page: Page,
  urlPattern?: string | RegExp,
): Promise<SseInterceptor> {
  await page.addInitScript(({ pattern }) => {
    const w = window as any;
    if (w.__sseTestBus) return; // idempotent
    w.__sseTestBus = {
      listeners: new Set<EventSource>(),
      match(url: string): boolean {
        if (!pattern) return true;
        if (pattern.kind === 'string') return url.includes(pattern.value);
        if (pattern.kind === 'regex') return new RegExp(pattern.value, pattern.flags).test(url);
        return false;
      },
    };

    const NativeEventSource = w.EventSource;
    class MockEventSource extends EventTarget {
      url: string;
      readyState = 0;
      withCredentials = false;
      onopen: ((e: Event) => void) | null = null;
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(url: string, _init?: EventSourceInit) {
        super();
        this.url = url;
        if (!w.__sseTestBus.match(url)) {
          // Not in pattern — fall back to real EventSource
          return new NativeEventSource(url, _init) as any;
        }
        w.__sseTestBus.listeners.add(this as any);
        // Open asynchronously to mimic real EventSource
        queueMicrotask(() => {
          this.readyState = 1;
          const e = new Event('open');
          this.onopen?.(e);
          this.dispatchEvent(e);
        });
      }
      close() {
        this.readyState = 2;
        w.__sseTestBus.listeners.delete(this as any);
      }
    }
    w.EventSource = MockEventSource;
  }, {
    pattern: !urlPattern
      ? null
      : typeof urlPattern === 'string'
      ? { kind: 'string', value: urlPattern }
      : { kind: 'regex', value: urlPattern.source, flags: urlPattern.flags },
  });

  return {
    pushEvent: async (event) => {
      await page.evaluate(({ name, data, id }) => {
        const w = window as any;
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        for (const es of w.__sseTestBus.listeners) {
          const evt = new MessageEvent(name || 'message', { data: payload, lastEventId: id });
          if (name && name !== 'message') {
            es.dispatchEvent(evt);
          } else {
            es.onmessage?.(evt);
            es.dispatchEvent(evt);
          }
        }
      }, event);
    },
    closeAll: async () => {
      await page.evaluate(() => {
        const w = window as any;
        for (const es of w.__sseTestBus.listeners) {
          es.close();
          es.onerror?.(new Event('error'));
        }
      });
    },
  };
}
