/*
 * Node.isConnected polyfill for EdgeHTML
 * 2021-04-12
 *
 * By Eli Grey, https://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

if (!("isConnected" in Node.prototype)) {
  Object.defineProperty(Node.prototype, "isConnected", {
    get() {
      return (
        !this.ownerDocument ||
        !(
          this.ownerDocument.compareDocumentPosition(this) &
          this.DOCUMENT_POSITION_DISCONNECTED
        )
      );
    },
  });
}
