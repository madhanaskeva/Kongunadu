import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store/store';
import { AntdProvider } from './app/AntdProvider';
import App from './App';
import './utils/tms-data';
import './utils/mockSeed';
import './utils/tms-report-builder';
import './styles/global.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AntdProvider>
        <App />
      </AntdProvider>
    </Provider>
  </React.StrictMode>
);

