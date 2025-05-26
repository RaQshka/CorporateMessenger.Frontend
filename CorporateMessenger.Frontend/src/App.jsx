import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Home from './pages/Home';
import ChatList from './components/ChatList';
import PrivateRoute from './components/PrivateRoute';
import { Box, Heading, Text } from '@chakra-ui/react';
import Header from './components/Header';
import Footer from './components/Footer';

function NotFound() {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={6} textAlign="center">
        <Heading as="h1" mb={4}>404 - Страница не найдена</Heading>
        <Text>Запрошенная страница не существует.</Text>
      </Box>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/chats" element={<PrivateRoute><ChatList /></PrivateRoute>} />
        <Route path="/chat/:chatId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;