// https://stackoverflow.com/a/37477096

// Create Element.remove() function if not exist
if (!("remove" in Element.prototype)) {
  Element.prototype.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}
