import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StudentAppProvider } from './context/StudentAppContext';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
 <BrowserRouter>
    <div className="font-montserrat">
      <StudentAppProvider>
        <App />
      <ToastContainer position="top-right" autoClose={3000} />
      </StudentAppProvider>
    </div>
  </BrowserRouter>
)
