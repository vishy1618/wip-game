import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResultsModal.css';

const ResultsModal = ({ completedOrders, onRestart, gameType, wipSamples }) => {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState({ loading: false, success: null, error: null });
  const [hasCalledApi, setHasCalledApi] = useState(false);
  const results = useMemo(() => {
    if (completedOrders.length === 0) return null;

    const totalTime = Math.max(...completedOrders.map(order => order.completionTime)) - 
                     Math.min(...completedOrders.map(order => order.startTime));
    
    const orderTimes = completedOrders.map(order => ({
      id: order.id,
      time: order.completionTime - order.startTime
    }));

    const averageTime = orderTimes.reduce((sum, order) => sum + order.time, 0) / orderTimes.length;

    // Calculate average WIP if samples are provided
    let averageWIP = 0;
    if (wipSamples && wipSamples.length > 0) {
      // Only consider samples where WIP > 0 (actual work is happening)
      const activeSamples = wipSamples.filter(sample => sample.wip > 0);
      if (activeSamples.length > 0) {
        const totalWIP = activeSamples.reduce((sum, sample) => sum + sample.wip, 0);
        averageWIP = totalWIP / activeSamples.length;
      }
    }

    return {
      totalTime: Math.round(totalTime / 1000),
      orderTimes: orderTimes.map(order => ({
        ...order,
        time: Math.round(order.time / 1000)
      })),
      averageTime: Math.round(averageTime / 1000),
      averageWIP: Math.round(averageWIP * 100) / 100 // Round to 2 decimal places
    };
  }, [completedOrders, wipSamples]);

  const saveGameResults = async (totalTime, averageTime, gameType, averageWIP) => {
    setApiStatus({ loading: true, success: null, error: null });
    
    try {
      const requestData = {
        totalTime,
        averageTime,
        gameType,
        averageWIP
      };
      
      console.log('Sending game results:', requestData);
      
      const response = await fetch('/game-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        // Handle HTTP errors
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status
        }
        setApiStatus({ loading: false, success: false, error: errorMessage });
        console.error('HTTP error saving results:', errorMessage);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setApiStatus({ loading: false, success: true, error: null });
        console.log('Game results saved:', result.documentId);
      } else {
        setApiStatus({ loading: false, success: false, error: result.error });
        console.error('Error saving results:', result.error);
      }
    } catch (error) {
      setApiStatus({ loading: false, success: false, error: error.message });
      console.error('Network error:', error);
    }
  };

  useEffect(() => {
    if (results && gameType && !hasCalledApi) {
      setHasCalledApi(true);
      saveGameResults(results.totalTime, results.averageTime, gameType, results.averageWIP);
    }
  }, [results, gameType, hasCalledApi]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!results) return null;

  return (
    <div className="results-modal-overlay">
      <div className="results-modal">
        <h2>🍕 Game Complete! 🍕</h2>
        
        <div className="results-content">
          <div className="results-summary">
            <div className="stat-item">
              <h4>Total Time</h4>
              <div className="stat-value">{formatTime(results.totalTime)}</div>
            </div>
            <div className="stat-item">
              <h4>Average Time</h4>
              <div className="stat-value">{formatTime(results.averageTime)}</div>
            </div>
            {results.averageWIP !== undefined && (
              <div className="stat-item">
                <h4>Average WIP</h4>
                <div className="stat-value wip-value">{results.averageWIP}</div>
              </div>
            )}
          </div>

          <div className="order-breakdown">
            <h4>Individual Times</h4>
            <div className="order-times">
              {results.orderTimes.map(order => (
                <span key={order.id} className="order-time">
                  #{order.id}: {formatTime(order.time)}
                </span>
              ))}
            </div>
          </div>
          
          <div className="api-status">
            {apiStatus.loading && <p>💾 Saving results...</p>}
            {apiStatus.success && <p>✅ Results saved successfully!</p>}
            {apiStatus.error && <p>⚠️ Failed to save: {apiStatus.error}</p>}
          </div>
        </div>

        <div className="modal-buttons">
          <button onClick={onRestart} className="restart-button">
            Play Again
          </button>
          <button onClick={() => navigate('/')} className="exit-button">
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
