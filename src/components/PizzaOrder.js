import React, { useState, useEffect } from 'react';
import './PizzaOrder.css';

const PizzaOrder = ({ order, availableIngredients, onAddIngredient }) => {
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - order.startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [order.startTime]);

  useEffect(() => {
    if (order.addedIngredients.length > 0) {
      setIsDisabled(true);
      const timeout = setTimeout(() => {
        setIsDisabled(false);
        setSelectedIngredient('');
      }, 2000); // Re-enable after 2 seconds
      return () => clearTimeout(timeout);
    }
  }, [order.addedIngredients.length]);

  const completionPercentage = Math.round(
    (order.addedIngredients.length / order.requiredIngredients.length) * 100
  );

  const handleAddIngredient = () => {
    if (selectedIngredient && !isDisabled) {
      onAddIngredient(order.id, selectedIngredient);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pizza-order-card">
      <div className="order-header">
        <h3>Order #{order.id}</h3>
        <div className="timer">⏱️ {formatTime(elapsedTime)}</div>
      </div>

      <div className="pizza-base">
        <div className="pizza-circle">
          {order.addedIngredients.map((ingredient, index) => (
            <div key={index} className={`ingredient ingredient-${index}`}>
              {ingredient.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>

      <div className="order-details">
        <div className="required-ingredients">
          <h4>Required Ingredients:</h4>
          <ul>
            {order.requiredIngredients.map((ingredient, index) => (
              <li
                key={index}
                className={order.addedIngredients.includes(ingredient) ? 'completed' : ''}
              >
                {ingredient}
                {order.addedIngredients.includes(ingredient) && ' ✓'}
              </li>
            ))}
          </ul>
        </div>

        <div className="completion-status">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span>{completionPercentage}% Complete</span>
        </div>

        <div className="ingredient-controls">
          <select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
            disabled={isDisabled || order.isCompleted}
          >
            <option value="">Select ingredient...</option>
            {availableIngredients
              .filter(ingredient => order.requiredIngredients.includes(ingredient))
              .filter(ingredient => !order.addedIngredients.includes(ingredient))
              .map(ingredient => (
                <option key={ingredient} value={ingredient}>
                  {ingredient}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddIngredient}
            disabled={!selectedIngredient || isDisabled || order.isCompleted}
            className="add-button"
          >
            Add
          </button>
        </div>

        {isDisabled && !order.isCompleted && (
          <div className="disabled-message">
            Controls disabled for 2 seconds. Work on other orders!
          </div>
        )}
      </div>
    </div>
  );
};

export default PizzaOrder;
