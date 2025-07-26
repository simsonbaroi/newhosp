console.log('=== MAIN.TSX LOADING ===');

// Test basic DOM manipulation first
const rootElement = document.getElementById("root");
console.log('Root element found:', !!rootElement);

if (rootElement) {
  console.log('Setting basic HTML content...');
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h1 style="color: green;">Hospital Bill Calculator</h1>
      <p>Basic HTML is working! Loading React...</p>
      <div id="test-buttons">
        <button style="padding: 10px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px;">Outpatient</button>
        <button style="padding: 10px; margin: 5px; background: #2196F3; color: white; border: none; border-radius: 4px;">Inpatient</button>
        <button style="padding: 10px; margin: 5px; background: #FF9800; color: white; border: none; border-radius: 4px;">Database</button>
      </div>
    </div>
  `;
  
  // Try to load React after showing basic HTML
  setTimeout(() => {
    console.log('Attempting to load React...');
    try {
      import('react-dom/client').then(({ createRoot }) => {
        import('./SimpleApp.tsx').then(({ default: SimpleApp }) => {
          console.log('React modules loaded, rendering...');
          createRoot(rootElement).render(SimpleApp());
          console.log('React app rendered successfully!');
        }).catch(err => {
          console.error('Error loading SimpleApp:', err);
          rootElement.innerHTML += '<p style="color: red;">Error loading React component: ' + err.message + '</p>';
        });
      }).catch(err => {
        console.error('Error loading React DOM:', err);
        rootElement.innerHTML += '<p style="color: red;">Error loading React DOM: ' + err.message + '</p>';
      });
    } catch (err: any) {
      console.error('Error in setTimeout:', err);
      rootElement.innerHTML += '<p style="color: red;">Error in React loading: ' + err.message + '</p>';
    }
  }, 1000);
} else {
  console.error('ROOT ELEMENT NOT FOUND!');
  document.body.innerHTML = '<h1 style="color: red;">ROOT ELEMENT NOT FOUND!</h1>';
}
