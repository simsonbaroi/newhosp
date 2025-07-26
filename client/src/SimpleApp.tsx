function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Hospital Bill Calculator</h1>
      <p>Simple version loading successfully!</p>
      <div style={{ margin: '20px 0' }}>
        <button style={{ padding: '10px 20px', margin: '5px' }}>Outpatient</button>
        <button style={{ padding: '10px 20px', margin: '5px' }}>Inpatient</button>
        <button style={{ padding: '10px 20px', margin: '5px' }}>Database</button>
      </div>
    </div>
  );
}

export default SimpleApp;