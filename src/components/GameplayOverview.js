import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GameplayOverview.css';

const GameplayOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGameStats(true); // Show loading on initial load
    
    // Poll every 5 seconds to refresh data (without loading)
    const interval = setInterval(() => fetchGameStats(false), 5000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchGameStats = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/game-results', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching game statistics:', error);
      
      // Only show error on screen for initial load or persistent failures
      // Skip showing temporary errors like 502 during polling
      if (showLoading || !stats) {
        setError(error.message);
      }
      // For polling errors, just log them and keep showing last successful data
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };



  if (loading) {
    return (
      <div className="gameplay-overview">
        <div className="loading">Loading game statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gameplay-overview">
        <div className="error">
          Error loading statistics: {error}
          <button onClick={() => fetchGameStats(true)} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="gameplay-overview">
        <div className="no-data">No game data available</div>
      </div>
    );
  }

  const { wip } = stats;
  const totalGames = wip ? wip.count : 0;

  return (
    <div className="gameplay-overview">
      <Link to="/" className="home-link">← Back to Home</Link>
      <h1>Gameplay Overview</h1>
      
      <div className="stats-container">
        <div className="stat-card">
          <h2>Total Games Played</h2>
          <div className="stat-value large">{totalGames}</div>
        </div>

        {totalGames > 0 && (
          <>
            <div className="stat-card">
              <h2>Average Total Time</h2>
              <div className="stat-value large">{formatTime(wip.avgTotalTime)}</div>
              <div className="stat-description">Time to complete all 5 pizzas</div>
            </div>

            <div className="stat-card">
              <h2>Average Time Per Pizza</h2>
              <div className="stat-value large">{formatTime(wip.avgAverageTime)}</div>
              <div className="stat-description">Time to complete each pizza</div>
            </div>

            {wip.avgWIP !== undefined && (
              <div className="stat-card">
                <h2>Average Work in Progress</h2>
                <div className="stat-value large">{wip.avgWIP.toFixed(2)}</div>
                <div className="stat-description">Average pizzas worked on simultaneously</div>
              </div>
            )}
          </>
        )}
      </div>

      {totalGames === 0 && (
        <div className="no-games">
          <p>No games have been played yet. Start playing to see statistics!</p>
          <Link to="/game" className="play-button">Play Your First Game</Link>
        </div>
      )}
    </div>
  );
};

export default GameplayOverview;
