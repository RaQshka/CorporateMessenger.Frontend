import { useState, useEffect } from 'react';
import { 
  Box, Button, Heading, VStack, Modal, 
  ModalOverlay, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, Text, useToast,
  HStack, Icon, Badge, Divider
} from '@chakra-ui/react';
import { HubConnectionBuilder } from "@microsoft/signalr";
import { FaShieldAlt, FaPlus, FaSignInAlt, FaKey, FaTrash } from 'react-icons/fa';
import CreateSecureChatModal from '../features/secureChat/CreateSecureChatModal';
import EnterSecureChatModal from '../features/secureChat/EnterSecureChatModal';
import ChatActivity from '../features/secureChat/ChatActivity';
import { destroySecureChat } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SecureChatPage({ userId }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [accessKey, setAccessKey] = useState(null);
  const [isAccessKeyModalOpen, setIsAccessKeyModalOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [connection, setConnection] = useState(null);
  const toast = useToast();

  // Инициализация соединения SignalR
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5056/encryptedChatHub", {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        
        // Подписка на события
        newConnection.on("ReceiveEncryptedMessage", (message) => {
          console.log("New encrypted message:", message);
        });
        
        newConnection.on("PublicKeyUpdated", (updatedUserId, newPublicKey) => {
          console.log("Public key updated:", updatedUserId, newPublicKey);
          if (updatedUserId !== userId && chatInfo) {
            // Обновление ключа при изменении
          }
        });
      })
      .catch(err => console.error('SignalR Connection Error:', err));

    return () => {
      newConnection.stop().catch(err => console.error('SignalR Stop Error:', err));
    };
  }, [userId, chatInfo]);

  // Присоединение к группе чата при изменении chatInfo
  useEffect(() => {
    if (connection && connection.state === 'Connected' && chatInfo?.chatId) {
      connection.invoke("JoinChat", chatInfo.chatId)
        .catch(err => console.error('Join chat error:', err));
    }
  }, [connection, chatInfo?.chatId]);

  const handleChatCreated = (newChatInfo) => {
    setChatInfo(newChatInfo);
    setAccessKey(newChatInfo.accessKey);
    setIsAccessKeyModalOpen(true);
  };

  const handleChatEntered = (enteredChatInfo) => {
    setChatInfo(enteredChatInfo);
    setAccessKey(enteredChatInfo.accessKey);
  };

  const handleDestroyChat = async () => {
    try {
      await destroySecureChat(chatInfo.chatId);
      setChatInfo(null);
      setAccessKey(null);
      setIsAccessKeyModalOpen(false);
      toast({
        title: 'Чат уничтожен',
        description: 'Безопасный чат был успешно удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Chat destroy error:", error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить чат',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const closeAccessKeyModal = () => {
    setIsAccessKeyModalOpen(false);
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Header />
      
      <Box maxW="1200px" mx="auto" p={6}>
        {/* Заголовок страницы */}
        <VStack spacing={4} mb={8} align="stretch">
          <HStack justify="space-between">
            <Heading 
              size="xl" 
              color="gray.800"
              display="flex"
              alignItems="center"
              gap={3}
            >
              <Icon as={FaShieldAlt} color="blue.500" boxSize={8} />
              Безопасный чат
            </Heading>
            <Badge colorScheme="green" fontSize="0.9em" px={3} py={1}>
              E2E Шифрование
            </Badge>
          </HStack>
          
          <Text color="gray.600" fontSize="md">
            Создайте защищенный чат с сквозным шифрованием для безопасного обмена сообщениями и документами
          </Text>
        </VStack>

        {/* Карточки действий */}
        {!chatInfo ? (
          <HStack spacing={6} justify="center" mb={8}>
            <Button
              leftIcon={<Icon as={FaPlus} />}
              colorScheme="blue"
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.2s"
              px={8}
              py={6}
            >
              Создать чат
            </Button>
            
            <Button
              leftIcon={<Icon as={FaSignInAlt} />}
              colorScheme="green"
              size="lg"
              onClick={() => setIsEnterModalOpen(true)}
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.2s"
              px={8}
              py={6}
            >
              Войти в чат
            </Button>
          </HStack>
        ) : (
          /* Активный чат */
          <Box
            bg="white"
            borderRadius="xl"
            boxShadow="2xl"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.200"
          >
            {/* Шапка активного чата */}
            <Box bg="blue.500" p={6}>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="white">
                    Активный безопасный чат
                  </Heading>
                  <Text color="blue.100" fontSize="sm">
                    ID: {chatInfo.chatId}
                  </Text>
                </VStack>
                <HStack>
                  {chatInfo.isCreator && (
                    <Button
                      leftIcon={<Icon as={FaTrash} />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={handleDestroyChat}
                      _hover={{ bg: 'red.500', color: 'white' }}
                    >
                      Уничтожить
                    </Button>
                  )}
                </HStack>
              </HStack>
            </Box>

            {/* Область чата */}
            <Box p={6}>
              <ChatActivity 
                chatId={chatInfo.chatId} 
                aesKey={chatInfo.aesKey} 
                userId={userId}
                connection={connection}
              />
            </Box>
          </Box>
        )}

        {/* Информация о безопасности */}
        <Box mt={8} p={6} bg="white" borderRadius="lg" boxShadow="md" border="1px solid" borderColor="gray.200">
          <Heading size="md" mb={4} color="gray.700">
            🔒 Как это работает
          </Heading>
          <VStack align="start" spacing={3} color="gray.600">
            <Text>• <strong>ECDH P-256</strong> - генерация пар ключей для каждого участника</Text>
            <Text>• <strong>AES-GCM 256</strong> - симметричное шифрование сообщений</Text>
            <Text>• <strong>End-to-End</strong> - только участники могут расшифровать сообщения</Text>
            <Text>• <strong>SignalR</strong> - реальное время доставки сообщений</Text>
          </VStack>
        </Box>
      </Box>
      
      <Footer/>

      {/* Модальные окна */}
      <CreateSecureChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChatCreated={handleChatCreated}
        userId={userId}
      />
      
      <EnterSecureChatModal
        isOpen={isEnterModalOpen}
        onClose={() => setIsEnterModalOpen(false)}
        onChatEntered={handleChatEntered}
        userId={userId}
      />
      
      <Modal isOpen={isAccessKeyModalOpen} onClose={closeAccessKeyModal} isCentered>
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl">
          <ModalHeader bg="blue.500" color="white" borderTopRadius="xl">
            <HStack>
              <Icon as={FaKey} />
              <Text>Код доступа к чату</Text>
            </HStack>
          </ModalHeader>
          <ModalBody p={6}>
            <Text color="gray.600" mb={3}>
              Сохраните этот код для доступа к чату. Передайте его собеседнику безопасным способом.
            </Text>
            <Box
              p={4}
              bg="gray.100"
              borderRadius="md"
              textAlign="center"
              borderWidth="2px"
              borderColor="blue.300"
            >
              <Text 
                fontSize="2xl" 
                fontWeight="bold" 
                color="blue.600"
                fontFamily="monospace"
                letterSpacing="wide"
              >
                {accessKey}
              </Text>
            </Box>
            <Text fontSize="sm" color="orange.600" mt={3} fontStyle="italic">
              ⚠️ Внимание: Этот код будет показан только один раз!
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              onClick={closeAccessKeyModal}
              size="lg"
              width="full"
            >
              Понятно
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default SecureChatPage;