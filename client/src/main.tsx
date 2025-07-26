import { createRoot } from 'react-dom/client'
import SimpleApp from './SimpleApp.tsx'
import './index.css'

console.log('main.tsx loaded');

// Simple test first
const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  console.log('Creating React root...');
  // Test with simple content first
  rootElement.innerHTML = '<h1>React is loading...</h1>';
  
  try {
    createRoot(rootElement).render(<SimpleApp />);
    console.log('SimpleApp rendered successfully');
  } catch (error: any) {
    console.error('Error rendering SimpleApp:', error);
    rootElement.innerHTML = '<h1>Error loading app: ' + error.message + '</h1>';
  }
} else {
  console.error('Root element not found!');
  document.body.innerHTML = '<h1>Root element not found!</h1>';
}
