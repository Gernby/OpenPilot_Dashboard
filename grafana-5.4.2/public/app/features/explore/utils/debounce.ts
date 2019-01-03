// Based on underscore.js debounce()
export default function debounce(func, wait) {
  let timeout;
  return function(this: any) {
    const context = this;
    const args = arguments;
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
