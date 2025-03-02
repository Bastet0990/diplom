import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssVarsProvider } from '@mui/joy';
import { getInitColorSchemeScript } from '@mui/joy/styles';
import Chat from './pages/Chat';
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <>
      {getInitColorSchemeScript({ defaultMode: 'dark' })}
      <CssVarsProvider defaultMode="dark">
        <AuthProvider>
          <Routes>
            <Route path='/' element={<Chat />} />
          </Routes>
        </AuthProvider>
      </CssVarsProvider>
    </>
  );
}

export default App;
