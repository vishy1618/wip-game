import React from 'react';
import './ResultsModal.css';

const ResultsModal = ({ completedOrders, onRestart }) => {
  const calculateResults = () => {
    if (completedOrders.length === 0) return null;

    const totalTime = Math.max(...completedOrders.map(order => order.completionTime)) - 
                     Math.min(...completedOrders.map(order => order.startTime));
    
    const orderTimes = completedOrders.map(order => ({
      id: order.id,
      time: order.completionTime - order.startTime
    }));

    const averageTime = orderTimes.reduce((sum, order) => sum + order.time, 0) / orderTimes.length;

    return {
      totalTime: Math.round(totalTime / 1000),
      orderTimes: orderTimes.map(order => ({
        ...order,
        time: Math.round(order.time / 1000)
      })),
      averageTime: Math.round(averageTime / 1000)
    };
  };

  const results = calculateResults();

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
          <div className="total-time">
            <h3>Total Time to Complete All Orders</h3>
            <div className="time-display">{formatTime(results.totalTime)}</div>
          </div>

          <div className="order-breakdown">
            <h3>Time per Pizza</h3>
            <ul>
              {results.orderTimes.map(order => (
                <li key={order.id}>
                  Order #{order.id}: {formatTime(order.time)}
                </li>
              ))}
            </ul>
          </div>

          <div className="average-time">
            <h3>Average Time per Pizza</h3>
            <div className="time-display">{formatTime(results.averageTime)}</div>
          </div>
        </div>

        <button onClick={onRestart} className="restart-button">
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ResultsModal;
