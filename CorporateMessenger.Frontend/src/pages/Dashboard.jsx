import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Button, useToast } from '@chakra-ui/react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { getUserChats, getChatAccessRules } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatList from '../features/chat/ChatList';
import ChatActivity from '../features/chat/ChatActivity';
import ChatAccessModal from '../features/chat/ChatAccessModal';

// Utility function to get cookie value
function getCookie(name) {
  const fullCookieString = '; ' + document.cookie;
  const splitCookie = fullCookieString.split('; ' + name + '=');
  return splitCookie.length === 2 ? splitCookie.pop().split(';').shift() : null;
}

function Dashboard() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [userPermissions, setUserPermissions] = useState(0);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [connection, setConnection] = useState(null);
  const toast = useToast();
  const userId = getCookie('UserId'); // Updated to use cookies instead of localStorage

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getUserChats();
        if (Array.isArray(data)) {
          setChats(data);
        } else {
          throw new Error('Invalid chat data format');
        }
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить чаты.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchChats();
  }, [toast]);

  useEffect(() => {
    if (selectedChat && userId) {
      const fetchPermissions = async () => {
        try {
          const rules = await getChatAccessRules(selectedChat.id);
          const userRule = rules.find((rule) => rule.userId === userId);
          setUserPermissions(userRule?.accessMask || 0);
        } catch (err) {
          console.error('Failed to fetch permissions:', err);
        }
      };
      fetchPermissions();
    }
  }, [selectedChat, userId]);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5056/chatHub', {
        accessTokenFactory: () => localStorage.getItem('token'),
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    newConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    return () => {
      newConnection.stop().catch((err) => console.error('SignalR Stop Error:', err));
    };
  }, []);

  const canManageAccess = (userPermissions & 512) === 512;

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Flex flex="1" p={4}>
        <ChatList
          chats={chats}
          setChats={setChats}
          onSelectChat={setSelectedChat}
          selectedChatId={selectedChat?.id}
        />
        <Box w="70%" pl={4}>
          {selectedChat ? (
            <>
              <Flex align="center" mb={4}>
                <Flex>
                  {canManageAccess && (
                    <Button
                      size="md"
                      mr={2}
                      onClick={() => setIsAccessModalOpen(true)}
                    >
                      Настроить доступ
                    </Button>
                  )}
                  <Heading as="h3" size="md">
                    {selectedChat.name}
                  </Heading>
                </Flex>
              </Flex>
              <ChatActivity
                chatId={selectedChat.id}
                userId={userId}
                connection={connection}
                userPermissions={userPermissions}
              />
            </>
          ) : (
            <Box>Выберите чат</Box>
          )}
        </Box>
      </Flex>
      {selectedChat && (
        <ChatAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          chatId={selectedChat.id}
        />
      )}
      <Footer />
    </Box>
  );
}

export default Dashboard;