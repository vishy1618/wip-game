import React, { useState, useEffect } from 'react';
import './GameplayOverview.css';

const GameplayOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGameStats();
  }, []);

  const fetchGameStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game-results`, {
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
      setError(error.message);
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

  const formatPercentage = (percentage, type) => {
    if (!percentage || percentage === 0) return 'No comparison available';
    
    const absPercentage = Math.abs(percentage);
    const isFaster = percentage > 0;
    
    return (
      <span className={isFaster ? 'faster' : 'slower'}>
        {isFaster ? 'Multitask is ' : 'Singletask is '}
        {absPercentage.toFixed(1)}% faster
        {type === 'total' ? ' overall' : ' per pizza'}
      </span>
    );
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
          <button onClick={fetchGameStats} className="retry-button">
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

  const { multitask, singletask, comparison } = stats;
  const totalGames = multitask.count + singletask.count;

  return (
    <div className="gameplay-overview">
      <h1>Gameplay Overview</h1>
      
      <div className="total-games">
        <h2>Total Games Played: {totalGames}</h2>
      </div>

      <div className="stats-grid">
        <div className="game-type-stats multitask-stats">
          <h3>Multitask Mode</h3>
          <div className="stat-item">
            <span className="stat-label">Games Played:</span>
            <span className="stat-value">{multitask.count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Total Time:</span>
            <span className="stat-value">{formatTime(multitask.avgTotalTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Time Per Pizza:</span>
            <span className="stat-value">{formatTime(multitask.avgAverageTime)}</span>
          </div>
        </div>

        <div className="game-type-stats singletask-stats">
          <h3>Singletask Mode</h3>
          <div className="stat-item">
            <span className="stat-label">Games Played:</span>
            <span className="stat-value">{singletask.count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Total Time:</span>
            <span className="stat-value">{formatTime(singletask.avgTotalTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Time Per Pizza:</span>
            <span className="stat-value">{formatTime(singletask.avgAverageTime)}</span>
          </div>
        </div>
      </div>

      {(multitask.count > 0 && singletask.count > 0) && (
        <div className="comparison-section">
          <h3>Mode Comparison</h3>
          <div className="comparison-stats">
            <div className="comparison-item">
              <span className="comparison-label">Total Time Performance:</span>
              <span className="comparison-value">
                {formatPercentage(comparison.totalTimePercentage, 'total')}
              </span>
            </div>
            <div className="comparison-item">
              <span className="comparison-label">Per Pizza Performance:</span>
              <span className="comparison-value">
                {formatPercentage(comparison.averageTimePercentage, 'pizza')}
              </span>
            </div>
          </div>
        </div>
      )}

      {totalGames === 0 && (
        <div className="no-games">
          <p>No games have been played yet. Start playing to see statistics!</p>
        </div>
      )}
    </div>
  );
};

export default GameplayOverview;
