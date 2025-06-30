import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import MultiTaskGame from './components/MultiTaskGame';
import SingleTaskGame from './components/SingleTaskGame';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/multitask" element={<MultiTaskGame />} />
          <Route path="/singletask" element={<SingleTaskGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
