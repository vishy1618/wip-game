import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="home-header">
        <h1>🍕 Pizza Game</h1>
        <p>Welcome to the ultimate pizza-making challenge!</p>
      </header>

      <main className="home-content">
        <div className="games-grid">
          <div className="game-card">
            <div className="game-icon">🍕</div>
            <h2>Pizza Game</h2>
            <p>
              Prepare as many pizzas as possible without keeping customers waiting! 
              Manage multiple orders, add ingredients efficiently, and complete orders to keep customers happy.
            </p>
            <Link to="/game" className="play-button">
              Play Now
            </Link>
          </div>
          
          <div className="game-card">
            <div className="game-icon">📊</div>
            <h2>Gameplay Overview</h2>
            <p>
              View detailed statistics from your pizza-making sessions.
              Track your performance and see how efficiently you handle orders!
            </p>
            <Link to="/overview" className="play-button">
              View Stats
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
