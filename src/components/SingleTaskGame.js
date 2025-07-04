import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PizzaOrder from './PizzaOrder';
import ResultsModal from './ResultsModal';
import './SingleTaskGame.css';

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

const generateRandomOrder = (orderId) => {
  const numIngredients = Math.floor(Math.random() * 4) + 2; // 2-5 ingredients
  const shuffled = [...INGREDIENTS].sort(() => 0.5 - Math.random());
  const requiredIngredients = shuffled.slice(0, numIngredients);
  
  return {
    id: orderId,
    requiredIngredients,
    addedIngredients: [],
    startTime: Date.now(),
    completionTime: null,
    isCompleted: false
  };
};

function SingleTaskGame() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

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

  const handleAddIngredient = (orderId, ingredient) => {
    setOrders(prev => {
      const newOrders = prev.map(order => {
        if (order.id === orderId) {
          const newAddedIngredients = [...order.addedIngredients, ingredient];
          const isCompleted = newAddedIngredients.length === order.requiredIngredients.length;
          
          if (isCompleted && !order.isCompleted) {
            const completedOrder = {
              ...order,
              addedIngredients: newAddedIngredients,
              isCompleted: true,
              completionTime: Date.now()
            };
            
            // Only add to completedOrders if not already completed
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
          
          return {
            ...order,
            addedIngredients: newAddedIngredients
          };
        }
        return order;
      });
      return newOrders;
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setOrders([]);
    setCompletedOrders([]);
    setOrderCount(0);
    setGameCompleted(false);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setOrders([]);
    setCompletedOrders([]);
    setOrderCount(0);
  };

  return (
    <div className="singletask-game">
      <nav className="game-nav">
        <Link to="/" className="home-link">← Back to Home</Link>
      </nav>
      
      <header className="game-header">
        <h1>Pizza Single-Task Game</h1>
        <p className="game-description">Complete orders one at a time - only the oldest order can be worked on!</p>
        {!gameStarted && !gameCompleted && (
          <button onClick={startGame} className="start-button">
            Start Game
          </button>
        )}
      </header>

      <main className="game-area">
        {gameStarted && !gameCompleted && (
          <div className="orders-container">
            {orders.filter(order => !order.isCompleted).map(order => {
              const activeOrders = orders.filter(o => !o.isCompleted);
              // In single-task mode, only the oldest active order is enabled
              const oldestActiveOrder = activeOrders.sort((a, b) => a.id - b.id)[0];
              const isDisabled = order.id !== oldestActiveOrder?.id;
              
              return (
                <PizzaOrder
                  key={order.id}
                  order={order}
                  availableIngredients={INGREDIENTS}
                  onAddIngredient={handleAddIngredient}
                  isDisabled={isDisabled}
                  gameMode="singletask"
                />
              );
            })}
          </div>
        )}
      </main>

      {gameCompleted && (
        <ResultsModal
          completedOrders={completedOrders.filter((order, index, arr) => 
            arr.findIndex(o => o.id === order.id) === index
          )}
          onRestart={resetGame}
          gameType="singletask"
        />
      )}
      
      {/* Temporary debug */}
      <div style={{position: 'fixed', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', fontSize: '12px', borderRadius: '5px'}}>
        Completed: {completedOrders.length} | Game Complete: {gameCompleted.toString()}
      </div>
    </div>
  );
}

export default SingleTaskGame;
