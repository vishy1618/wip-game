import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResultsModal from './ResultsModal';
import './WIPGame.css';

const INGREDIENTS = [
  'Mozzarella cheese',
  'Tomato sauce',
  'Pepperoni',
  'Mushrooms',
  'Onions',
  'Bell peppers',
  'Black olives',
  'Italian sausage',
  'Fresh basil',
  'Garlic'
];

const INGREDIENT_EMOJIS = {
  'Mozzarella cheese': '🧀',
  'Tomato sauce': '🍅',
  'Pepperoni': '🔴',
  'Mushrooms': '🍄',
  'Onions': '🧅',
  'Bell peppers': '🫑',
  'Black olives': '🫒',
  'Italian sausage': '🌭',
  'Fresh basil': '🌿',
  'Garlic': '🧄'
};

const generateRandomOrder = (orderId) => {
  const numIngredients = Math.floor(Math.random() * 4) + 2; // 2-5 ingredients
  const shuffled = [...INGREDIENTS].sort(() => 0.5 - Math.random());
  const requiredIngredients = shuffled.slice(0, numIngredients);
  
  return {
    id: orderId,
    requiredIngredients,
    addedIngredients: [],
    addedIngredientPositions: {}, // Store positions for each ingredient
    startTime: Date.now(),
    completionTime: null,
    isCompleted: false
  };
};

function WIPGame() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameStartTime, setGameStartTime] = useState(null);
  const [wipSamples, setWipSamples] = useState([]);

  useEffect(() => {
    if (!gameStarted || gameCompleted || orderCount >= 5) return;

    const spawnOrder = () => {
      if (orderCount < 5) {
        const newOrder = generateRandomOrder(orderCount + 1);
        setOrders(prev => [...prev, newOrder]);
        setOrderCount(prev => prev + 1);
      }
    };

    // Spawn first order immediately
    if (orderCount === 0) {
      spawnOrder();
    } else {
      // Random delay between 5-10 seconds for subsequent orders
      const delay = Math.random() * 5000 + 5000;
      const timeout = setTimeout(spawnOrder, delay);
      return () => clearTimeout(timeout);
    }
  }, [gameStarted, gameCompleted, orderCount]);

  useEffect(() => {
    console.log('Completed orders changed:', completedOrders.length, completedOrders.map(o => o.id));
    // Get unique completed order IDs
    const uniqueCompletedIds = [...new Set(completedOrders.map(o => o.id))];
    console.log('Unique completed IDs:', uniqueCompletedIds);
    
    if (uniqueCompletedIds.length === 5) {
      console.log('Setting game completed!');
      setGameCompleted(true);
    }
  }, [completedOrders]);

  // Calculate current WIP (number of orders that have been started but not completed)
  const getCurrentWIP = () => {
    return orders.filter(order => 
      order.addedIngredients.length > 0 && !order.isCompleted
    ).length;
  };

  // Sample WIP every second during gameplay (only when there are orders to work on)
  useEffect(() => {
    if (!gameStarted || gameCompleted || orders.length === 0) return;

    const sampleWIP = () => {
      const currentWIP = getCurrentWIP();
      const timestamp = Date.now();
      // Only sample if there are orders available (even if WIP is 0, orders exist)
      setWipSamples(prev => [...prev, { wip: currentWIP, timestamp }]);
    };

    const interval = setInterval(sampleWIP, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted, orders]);

  const handleAddIngredient = (ingredient) => {
    // Clear any previous error message
    setErrorMessage('');
    
    if (!selectedOrderId) {
      setErrorMessage('Please select an order first!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    const selectedOrder = getSelectedOrder();
    if (!selectedOrder) {
      setErrorMessage('No valid order selected!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    // Check if ingredient is not required for this order
    if (!selectedOrder.requiredIngredients.includes(ingredient)) {
      setErrorMessage(`${ingredient} is not needed for this order!`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    // Check if ingredient is already added
    if (selectedOrder.addedIngredients.includes(ingredient)) {
      setErrorMessage(`${ingredient} has already been added!`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setOrders(prev => {
      const newOrders = prev.map(order => {
        if (order.id === selectedOrderId) {
          // Generate stable positions for this ingredient
          const count = getIngredientCount(ingredient);
          const positions = generateUniformPositions(count);
          
          return {
            ...order,
            addedIngredients: [...order.addedIngredients, ingredient],
            addedIngredientPositions: {
              ...order.addedIngredientPositions,
              [ingredient]: positions
            }
          };
        }
        return order;
      });
      return newOrders;
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setGameStartTime(Date.now());
    setOrders([]);
    setCompletedOrders([]);
    setOrderCount(0);
    setGameCompleted(false);
    setSelectedOrderId(null);
    setErrorMessage('');
    setWipSamples([]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setOrders([]);
    setCompletedOrders([]);
    setOrderCount(0);
    setSelectedOrderId(null);
    setErrorMessage('');
    setGameStartTime(null);
    setWipSamples([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedOrder = () => {
    return orders.find(order => order.id === selectedOrderId && !order.isCompleted);
  };

  const handleCompleteOrder = () => {
    if (!selectedOrderId) return;
    
    const selectedOrder = getSelectedOrder();
    if (!selectedOrder) return;
    
    // Check if all ingredients have been added
    if (selectedOrder.addedIngredients.length !== selectedOrder.requiredIngredients.length) {
      setErrorMessage('Please add all required ingredients before completing the order!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setOrders(prev => {
      const newOrders = prev.map(order => {
        if (order.id === selectedOrderId) {
          const completedOrder = {
            ...order,
            isCompleted: true,
            completionTime: Date.now()
          };
          
          // Add to completedOrders
          setCompletedOrders(prev => {
            // Check if this order is already in completedOrders
            if (prev.find(o => o.id === completedOrder.id)) {
              console.log('Order', completedOrder.id, 'already completed, not adding again');
              return prev;
            }
            console.log('Adding completed order', completedOrder.id);
            return [...prev, completedOrder];
          });
          
          return completedOrder;
        }
        return order;
      });
      return newOrders;
    });
    
    // Clear selection when order is completed
    setSelectedOrderId(null);
  };

  const isOrderReadyToComplete = () => {
    const selectedOrder = getSelectedOrder();
    if (!selectedOrder) return false;
    return selectedOrder.addedIngredients.length === selectedOrder.requiredIngredients.length;
  };

  const generateIngredientPosition = () => {
    // Create a more natural distribution across the pizza
    const radius = Math.random() * 35 + 15; // Random radius between 15% and 50% from center
    const angle = Math.random() * 360; // Completely random angle
    const angleRad = (angle * Math.PI) / 180;
    
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);
    
    return {
      top: `${Math.max(10, Math.min(90, y))}%`,
      left: `${Math.max(10, Math.min(90, x))}%`,
      transform: `rotate(${Math.random() * 360}deg)` // Random rotation for natural look
    };
  };

  const getIngredientCount = (ingredient) => {
    // More generous and uniform distribution for all ingredients
    return 12; // Uniform count for all ingredients for better coverage
  };

  const generateUniformPositions = (count) => {
    const positions = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    const gridSpacing = 60; // Total area for the grid
    const step = gridSpacing / Math.max(1, gridSize - 1); // Space between grid points
    
    // Calculate grid offset to center it on the pizza
    const gridStartX = (100 - gridSpacing) / 2; // Center horizontally
    const gridStartY = (100 - gridSpacing) / 2; // Center vertically
    
    for (let i = 0; i < count; i++) {
      // Create a grid-based position with randomness
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);
      
      // Base position from centered grid
      const baseX = gridStartX + gridX * step;
      const baseY = gridStartY + gridY * step;
      
      // Add randomness for natural distribution
      const randomOffsetX = (Math.random() - 0.5) * step * 0.8;
      const randomOffsetY = (Math.random() - 0.5) * step * 0.8;
      
      const finalX = Math.max(10, Math.min(90, baseX + randomOffsetX));
      const finalY = Math.max(10, Math.min(90, baseY + randomOffsetY));
      
      positions.push({
        top: `${finalY}%`,
        left: `${finalX}%`,
        transform: `rotate(${Math.random() * 360}deg)`
      });
    }
    
    return positions;
  };

  return (
    <div className="wip-game">
      <nav className="wip-game-nav">
        <Link to="/" className="wip-home-link">← Back to Home</Link>
      </nav>
      
      <header className="wip-game-header">
        <h1>Pizza WIP Game</h1>
        <p className="wip-game-description">Work on any order at any time - no constraints or limitations!</p>
        {!gameStarted && !gameCompleted && (
          <button onClick={startGame} className="wip-start-button">
            Start Game
          </button>
        )}
      </header>

      {gameStarted && !gameCompleted && (
        <div className="wip-game-content">
          {/* Left Sidebar - Orders */}
          <div className="wip-orders-sidebar">
            <h3>Orders</h3>
            {orders.filter(order => !order.isCompleted).map(order => {
              const elapsedTime = Math.floor((Date.now() - order.startTime) / 1000);
              const completionPercentage = Math.round(
                (order.addedIngredients.length / order.requiredIngredients.length) * 100
              );
              
              return (
                <div
                  key={order.id}
                  className={`wip-order-item ${selectedOrderId === order.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="wip-order-header">
                    <span className="wip-order-title">Order #{order.id}</span>
                    <span className="wip-order-timer">⏱️ {formatTime(elapsedTime)}</span>
                  </div>
                  <div className="wip-order-progress">
                    <div className="wip-progress-bar">
                      <div
                        className="wip-progress-fill"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span>{completionPercentage}% Complete</span>
                  </div>
                  <div className="wip-order-ingredients">
                    {order.requiredIngredients.length} ingredients needed
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Area - Pizza Display */}
          <div className="wip-pizza-area">
            {getSelectedOrder() && (
              <div className="wip-order-note">
                <h4>Order #{getSelectedOrder().id}</h4>
                <ul>
                  {getSelectedOrder().requiredIngredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className={getSelectedOrder().addedIngredients.includes(ingredient) ? 'completed' : ''}
                    >
                      {ingredient}
                      {getSelectedOrder().addedIngredients.includes(ingredient) && ' ✓'}
                    </li>
                  ))}
                </ul>
                <button
                  className={`wip-complete-button ${isOrderReadyToComplete() ? 'enabled' : 'disabled'}`}
                  onClick={handleCompleteOrder}
                  disabled={!isOrderReadyToComplete()}
                >
                  Order Complete
                </button>
              </div>
            )}
            <div className={`wip-tabletop ${!getSelectedOrder() ? 'empty' : ''}`}>
              {getSelectedOrder() ? (
                <div className="wip-pizza-display">
                  <div className="wip-pizza-base">
                    {getSelectedOrder().addedIngredients.map((ingredient, ingredientIndex) => {
                      const positions = getSelectedOrder().addedIngredientPositions[ingredient] || [];
                      return positions.map((position, pieceIndex) => (
                        <div
                          key={`${ingredient}-${pieceIndex}`}
                          className="wip-pizza-ingredient"
                          style={position}
                        >
                          {INGREDIENT_EMOJIS[ingredient] || '❓'}
                        </div>
                      ));
                    }).flat()}
                  </div>
                </div>
              ) : (
                <div className="wip-empty-message">
                  Select an order to start making pizza!
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Ingredients */}
          <div className="wip-ingredients-sidebar">
            <h3>Ingredients</h3>
            {errorMessage && (
              <div className="wip-error-message">
                {errorMessage}
              </div>
            )}
            {INGREDIENTS.map(ingredient => (
              <div
                key={ingredient}
                className="wip-ingredient-item"
                onClick={() => handleAddIngredient(ingredient)}
              >
                {ingredient}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameCompleted && (
        <ResultsModal
          completedOrders={completedOrders.filter((order, index, arr) => 
            arr.findIndex(o => o.id === order.id) === index
          )}
          onRestart={resetGame}
          gameType="wip"
          wipSamples={wipSamples}
        />
      )}
      
      {/* Debug Info */}
      <div className="wip-debug">
        Completed: {completedOrders.length} | Game Complete: {gameCompleted.toString()} | Selected: {selectedOrderId || 'None'}
      </div>
    </div>
  );
}

export default WIPGame;
