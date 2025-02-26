// utils/cart.js
export function addItemToCart(cartItems, newItem) {
    const existingItem = cartItems.find(item => item.id === newItem.id);
    if (existingItem) {
      return cartItems.map(item =>
        item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
      );
    }
    return [...cartItems, newItem];
  }
  
  export function removeItemFromCart(cartItems, itemId) {
    return cartItems.filter(item => item.id !== itemId);
  }
  
  export function updateItemQuantity(cartItems, itemId, quantity) {
    return cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
  }
  
  export function getCartTotal(cartItems) {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }
  