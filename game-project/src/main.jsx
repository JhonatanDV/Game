// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { setupConsoleFilter } from './utils/consoleFilter';

// Activar filtro de consola para suprimir warnings conocidos
setupConsoleFilter();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
