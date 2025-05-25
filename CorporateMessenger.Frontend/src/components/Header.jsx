import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Link,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Проверка авторизации при загрузке компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  return (
    <Box bg="blue.500" px={4} py={3} color="white">
      <Flex maxW="1200px" mx="auto" align="center" justify="space-between">
        <Text fontSize="xl" fontWeight="bold">
          Корпоративный мессенджер
        </Text>
        <Flex align="center" gap={4}>
          {isAuthenticated ? (
            <>
              <Link as={RouterLink} to="/dashboard" _hover={{ textDecoration: 'underline' }}>
                Главная
              </Link>
              <Link as={RouterLink} to="/chat/00000000-0000-0000-0000-000000000000" _hover={{ textDecoration: 'underline' }}>
                Чаты
              </Link>
              <Link as={RouterLink} to="/admin" _hover={{ textDecoration: 'underline' }}>
                Администрирование
              </Link>
              <Menu>
                <MenuButton as={Button} variant="ghost" p={0}>
                  <Avatar size="sm" />
                </MenuButton>
                <MenuList color="black">
                  <MenuItem as={RouterLink} to="/profile">
                    Профиль
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Link as={RouterLink} to="/login" _hover={{ textDecoration: 'underline' }}>
                Вход
              </Link>
              <Link as={RouterLink} to="/register" _hover={{ textDecoration: 'underline' }}>
                Регистрация
              </Link>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default Header;