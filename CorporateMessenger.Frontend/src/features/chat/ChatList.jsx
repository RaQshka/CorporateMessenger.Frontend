import { useState } from 'react';
import { Box, VStack, Text, Heading, Button } from '@chakra-ui/react';
import CreateChatModal from './CreateChatModal';

const CHAT_TYPES = [
  { value: 0, label: 'Групповой чат' }, // ChatTypes.Group
  { value: 1, label: 'Диалог' },        // ChatTypes.Dialog
  { value: 2, label: 'Канал' },         // ChatTypes.Channel
];

function ChatList({ chats, setChats, onSelectChat, selectedChatId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Box w="30%" borderRightWidth={1} pr={4}>
      <Heading as="h3" size="md" mb={4}>Чаты</Heading>
      <Button colorScheme="blue" mb={4} onClick={() => setIsModalOpen(true)}>
        Создать чат
      </Button>
      <CreateChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} setChats={setChats} />
      {chats.length === 0 ? (
        <Text>Нет чатов</Text>
      ) : (
        <VStack
          spacing={2}
          align="stretch"
          maxH="70vh" // Фиксированная высота
          overflowY="auto" // Включение скролла
          sx={{
            '&::-webkit-scrollbar': {
              width: '4px', // Тонкий скролл
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.300',
              borderRadius: '4px',
            },
          }}
        >
          {chats.map((chat) => (
            <Box
              key={chat.id}
              p={2}
              borderWidth={1}
              borderRadius="md"
              cursor="pointer"
              bg={selectedChatId === chat.id ? 'blue.100' : 'gray.500'}
              onClick={() => onSelectChat(chat)}
            >
              <Text fontWeight="bold">{chat.name}</Text>
              <Text fontSize="sm">
                Тип: {CHAT_TYPES.find((t) => t.value === parseInt(chat.type))?.label || chat.type}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}

export default ChatList;