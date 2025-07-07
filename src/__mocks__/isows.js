// Mock for isows WebSocket library
module.exports = {
  WebSocket: class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1; // OPEN
    }
    
    close() {
      this.readyState = 3; // CLOSED
    }
    
    send(data) {
      // Mock send method
    }
    
    addEventListener(event, handler) {
      // Mock event listener
    }
    
    removeEventListener(event, handler) {
      // Mock remove event listener
    }
  }
};