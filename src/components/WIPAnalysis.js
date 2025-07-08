import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import './WIPAnalysis.css';

const WIPAnalysis = () => {
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);

  useEffect(() => {
    fetchGameData();
  }, []);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // We'll need to create a new endpoint to get individual games
      // For now, let's use the existing endpoint and simulate individual data
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
      
      // Use the real individual game data from the API
      const realGameData = data.individualGames.wip || [];
      
      setGameData(realGameData);
      calculateCorrelations(realGameData);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };



  const calculateCorrelations = (games) => {
    if (games.length < 2) return;
    
    const correlations = {
      wipVsAvgTime: calculateCorrelation(
        games.map(g => g.averageWIP),
        games.map(g => g.averageTimePerPizza)
      ),
      wipVsTotalTime: calculateCorrelation(
        games.map(g => g.averageWIP),
        games.map(g => g.totalTime)
      )
    };
    
    setCorrelationData(correlations);
  };

  const calculateCorrelation = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    const sumYY = y.reduce((a, b) => a + b * b, 0);
    
    return (n * sumXY - sumX * sumY) / 
           Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="label">{`WIP: ${data.averageWIP}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="time-value" style={{ color: entry.color }}>
              {`${entry.name}: ${formatTime(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="wip-analysis">
        <div className="loading">Loading WIP analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wip-analysis">
        <div className="error">
          Error loading WIP analysis: {error}
          <button onClick={fetchGameData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (gameData.length === 0) {
    return (
      <div className="wip-analysis">
        <Link to="/" className="home-link">← Back to Home</Link>
        <h1>WIP Analysis</h1>
        <div className="no-data">
          <p>No game data available for analysis. Play some games to see WIP correlations!</p>
          <Link to="/game" className="play-button">Play Your First Game</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wip-analysis">
      <Link to="/" className="home-link">← Back to Home</Link>
      <h1>WIP Analysis</h1>
      <p className="analysis-description">
        Work in Progress (WIP) analysis showing how the number of pizzas worked on simultaneously 
        affects completion times. Lower WIP often leads to faster completion due to reduced context switching.
      </p>

      {correlationData && (
        <div className="correlation-summary">
          <div className="correlation-card">
            <h3>WIP vs Average Time Per Pizza</h3>
            <div className="correlation-value">
              {correlationData.wipVsAvgTime.toFixed(3)}
            </div>
            <div className="correlation-description">
              {Math.abs(correlationData.wipVsAvgTime) > 0.5 ? 
                (correlationData.wipVsAvgTime > 0 ? 'Strong positive correlation' : 'Strong negative correlation') :
                Math.abs(correlationData.wipVsAvgTime) > 0.3 ? 
                (correlationData.wipVsAvgTime > 0 ? 'Moderate positive correlation' : 'Moderate negative correlation') :
                'Weak correlation'
              }
            </div>
          </div>

          <div className="correlation-card">
            <h3>WIP vs Total Time</h3>
            <div className="correlation-value">
              {correlationData.wipVsTotalTime.toFixed(3)}
            </div>
            <div className="correlation-description">
              {Math.abs(correlationData.wipVsTotalTime) > 0.5 ? 
                (correlationData.wipVsTotalTime > 0 ? 'Strong positive correlation' : 'Strong negative correlation') :
                Math.abs(correlationData.wipVsTotalTime) > 0.3 ? 
                (correlationData.wipVsTotalTime > 0 ? 'Moderate positive correlation' : 'Moderate negative correlation') :
                'Weak correlation'
              }
            </div>
          </div>
        </div>
      )}

      <div className="charts-container">
        <div className="chart-section">
          <h2>WIP vs Performance Metrics</h2>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={gameData.sort((a, b) => a.averageWIP - b.averageWIP)}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="averageWIP" 
                name="Average WIP"
                type="number"
                domain={['dataMin - 0.2', 'dataMax + 0.2']}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={formatTime}
                label={{ value: 'Average Time Per Pizza', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={formatTime}
                label={{ value: 'Total Time', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="averageTimePerPizza" 
                stroke="#8884d8" 
                name="Avg Time Per Pizza"
                strokeWidth={3}
                dot={{ r: 5, fill: '#8884d8' }}
                connectNulls={false}
                activeDot={{ r: 8 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="totalTime" 
                stroke="#82ca9d" 
                name="Total Time"
                strokeWidth={3}
                dot={{ r: 5, fill: '#82ca9d' }}
                connectNulls={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WIPAnalysis;
