import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import WIPGame from './components/WIPGame';
import GameplayOverview from './components/GameplayOverview';
import WIPAnalysis from './components/WIPAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<WIPGame />} />
          <Route path="/overview" element={<GameplayOverview />} />
          <Route path="/wip-analysis" element={<WIPAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
