import React, { useState, useEffect } from 'react';
import PizzaOrder from './components/PizzaOrder';
import ResultsModal from './components/ResultsModal';
import './App.css';

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

function App() {
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
      // Random delay between 10-20 seconds for subsequent orders
      const delay = Math.random() * 10000 + 10000;
      const timeout = setTimeout(spawnOrder, delay);
      return () => clearTimeout(timeout);
    }
  }, [gameStarted, gameCompleted, orderCount]);

  useEffect(() => {
    if (completedOrders.length === 5) {
      setGameCompleted(true);
    }
  }, [completedOrders]);

  const handleAddIngredient = (orderId, ingredient) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const newAddedIngredients = [...order.addedIngredients, ingredient];
        const isCompleted = newAddedIngredients.length === order.requiredIngredients.length;
        
        if (isCompleted) {
          const completedOrder = {
            ...order,
            addedIngredients: newAddedIngredients,
            isCompleted: true,
            completionTime: Date.now()
          };
          
          setCompletedOrders(prev => [...prev, completedOrder]);
          return completedOrder;
        }
        
        return {
          ...order,
          addedIngredients: newAddedIngredients
        };
      }
      return order;
    }));
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
    <div className="App">
      <header className="App-header">
        <h1>Pizza Making Game</h1>
        {!gameStarted && !gameCompleted && (
          <button onClick={startGame} className="start-button">
            Start Game
          </button>
        )}
      </header>

      <main className="game-area">
        {gameStarted && !gameCompleted && (
          <div className="orders-container">
            {orders.filter(order => !order.isCompleted).map(order => (
              <PizzaOrder
                key={order.id}
                order={order}
                availableIngredients={INGREDIENTS}
                onAddIngredient={handleAddIngredient}
              />
            ))}
          </div>
        )}
      </main>

      {gameCompleted && (
        <ResultsModal
          completedOrders={completedOrders}
          onRestart={resetGame}
        />
      )}
    </div>
  );
}

export default App;
