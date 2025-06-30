import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="home-header">
        <h1>🎮 Game Collection</h1>
        <p>Welcome to our collection of interactive games!</p>
      </header>

      <main className="home-content">
        <div className="games-grid">
          <div className="game-card">
            <div className="game-icon">🍕</div>
            <h2>Pizza Multi-Tasking Game</h2>
            <p>
              Test your multitasking skills by managing multiple pizza orders simultaneously. 
              Add ingredients to pizzas while juggling timers and switching between orders!
            </p>
            <Link to="/multitask" className="play-button">
              Play Now
            </Link>
          </div>
          
          <div className="game-card">
            <div className="game-icon">🎯</div>
            <h2>Pizza Single-Task Game</h2>
            <p>
              Focus on one order at a time! Only the oldest order can be worked on until it's completed.
              Test your efficiency and order management skills!
            </p>
            <Link to="/singletask" className="play-button">
              Play Now
            </Link>
          </div>
          
          <div className="game-card">
            <div className="game-icon">📊</div>
            <h2>Gameplay Overview</h2>
            <p>
              View detailed statistics and performance comparisons between multitask and singletask modes.
              See which game type you perform better at!
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
