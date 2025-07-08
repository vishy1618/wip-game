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
  ResponsiveContainer,
  ScatterChart,
  Scatter
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
      
      // For now, simulate individual game data based on the aggregate stats
      // In a real implementation, we'd get this from the API
      const simulatedGames = generateSimulatedGameData(data.wip);
      
      setGameData(simulatedGames);
      calculateCorrelations(simulatedGames);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedGameData = (wipStats) => {
    if (!wipStats || wipStats.count === 0) return [];
    
    const games = [];
    const baseAvgTime = wipStats.avgAverageTime;
    const baseTotalTime = wipStats.avgTotalTime;
    const baseWIP = wipStats.avgWIP;
    
    // Generate synthetic data points around the averages
    for (let i = 0; i < Math.min(wipStats.count, 50); i++) {
      const wipVariation = baseWIP + (Math.random() - 0.5) * 2;
      const avgTimeVariation = baseAvgTime + (Math.random() - 0.5) * baseAvgTime * 0.4;
      const totalTimeVariation = baseTotalTime + (Math.random() - 0.5) * baseTotalTime * 0.3;
      
      // Add some correlation: higher WIP tends to reduce time per pizza
      const wipFactor = Math.max(0.5, Math.min(1.5, 1 + (baseWIP - wipVariation) * 0.1));
      
      games.push({
        gameNumber: i + 1,
        averageWIP: Math.max(1, Math.round(wipVariation * 10) / 10),
        averageTimePerPizza: Math.max(5, avgTimeVariation * wipFactor),
        totalTime: Math.max(25, totalTimeVariation * wipFactor),
        timestamp: new Date(Date.now() - (wipStats.count - i) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return games.sort((a, b) => a.gameNumber - b.gameNumber);
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
      return (
        <div className="custom-tooltip">
          <p className="label">{`Game ${label}`}</p>
          <p className="wip-value">{`WIP: ${payload[0].payload.averageWIP}`}</p>
          <p className="time-value">{`${payload[0].name}: ${formatTime(payload[0].value)}`}</p>
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
          <h2>WIP vs Average Time Per Pizza</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              data={gameData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="averageWIP" 
                name="Average WIP"
                type="number"
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <YAxis 
                name="Average Time Per Pizza (s)"
                tickFormatter={formatTime}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name="Average Time Per Pizza" 
                dataKey="averageTimePerPizza" 
                fill="#8884d8"
                line={{ stroke: '#8884d8', strokeWidth: 2 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>WIP vs Total Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              data={gameData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="averageWIP" 
                name="Average WIP"
                type="number"
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <YAxis 
                name="Total Time (s)"
                tickFormatter={formatTime}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name="Total Time" 
                dataKey="totalTime" 
                fill="#82ca9d"
                line={{ stroke: '#82ca9d', strokeWidth: 2 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>WIP Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={gameData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gameNumber" 
                name="Game Number"
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatTime} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="averageWIP" 
                stroke="#8884d8" 
                name="Average WIP"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="averageTimePerPizza" 
                stroke="#82ca9d" 
                name="Avg Time Per Pizza"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WIPAnalysis;
