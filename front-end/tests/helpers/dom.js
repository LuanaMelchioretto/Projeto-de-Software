import { JSDOM } from "jsdom";

export async function installDom(url = "http://localhost/") {

  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url });
  const originalGlobals = new Map();

  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    File: dom.window.File,
    FileReader: dom.window.FileReader,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  const { render, screen, within, waitFor, cleanup } = await import("@testing-library/react/pure.js");
  const { default: userEvent } = await import("@testing-library/user-event");

  function restore() {
    dom.window.close();
    
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }

  return { dom, render, screen, within, waitFor, cleanup, userEvent, restore };
}
