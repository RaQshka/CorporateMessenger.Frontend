import { useState, useEffect } from 'react';
import { Box, Flex, Link, Button, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { logoutUser, getProfile } from '../services/api';

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          toast({
            title: 'Сессия истекла',
            description: 'Пожалуйста, войдите снова.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        });
    }
  }, [toast]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/login');
      toast({
        title: 'Успех',
        description: 'Вы вышли из системы.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/login');
      toast({
        title: 'Ошибка',
        description: 'Не удалось выйти. Сессия завершена.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
                Панель
              </Link>
              <Link as={RouterLink} to="/chats" _hover={{ textDecoration: 'underline' }}>
                Чаты
              </Link>
              <Link as={RouterLink} to="/admin" _hover={{ textDecoration: 'underline' }}>
                Админ
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