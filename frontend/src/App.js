import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import CapacityPlanning from './components/CapacityPlanning';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Prevent multiple simultaneous requests
    if (isFetching) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/capacity-planning?days=30');
      setCapacityData(response.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data from Jira');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading delivery planning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Delivery Planning Tracker</h1>
        <button className="refresh-btn" onClick={fetchData}>
          Refresh Data
        </button>
      </header>

      <main className="dashboard-container">
        <CapacityPlanning data={capacityData} />
      </main>
    </div>
  );
}

export default App;
