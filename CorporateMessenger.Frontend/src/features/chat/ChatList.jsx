// features/chat/ChatList.jsx
import { useState } from 'react';
import { 
  Box, VStack, Text, Heading, Button, 
  Flex, Avatar, Badge, useColorModeValue 
} from '@chakra-ui/react';
import CreateChatModal from './CreateChatModal';
import { 
  FaUserFriends, 
  FaUsers, 
  FaBullhorn,
  FaPlus 
} from 'react-icons/fa';

const CHAT_TYPES = [
  { value: 0, label: 'Групповой чат', icon: FaUsers, color: 'blue' },
  { value: 1, label: 'Диалог', icon: FaUserFriends, color: 'green' },
  { value: 2, label: 'Канал', icon: FaBullhorn, color: 'purple' },
];

function ChatList({ chats, setChats, onSelectChat, selectedChatId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const scrollbarThumb = useColorModeValue('gray.400', 'gray.500');
  const scrollbarTrack = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box 
      w={{ base: '100%', md: '30%' }} 
      borderRightWidth={{ base: 0, md: '1px' }}
      borderColor={borderColor}
      h="85vh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex justify="space-between" align="center" mb={4} pt={2} px={4}>
        <Heading as="h3" size="md">Чаты</Heading>
        <Button 
          leftIcon={<FaPlus />}
          colorScheme="blue" 
          size="sm"
          onClick={() => setIsModalOpen(true)}
        >
          Создать
        </Button>
      </Flex>
      
      <CreateChatModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        setChats={setChats} 
      />
      
      {chats.length === 0 ? (
        <Box 
          flex="1" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
          <Text color="gray.500">Нет чатов</Text>
        </Box>
      ) : (
        <Box
          flex="1"
          overflowY="auto"
          px={2}
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: scrollbarTrack,
              borderRadius: '4px',
              marginY: '2px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: scrollbarThumb,
              borderRadius: '4px',
              border: '2px solid transparent',
              backgroundClip: 'content-box',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: useColorModeValue('gray.500', 'gray.400'),
            },
            scrollbarWidth: 'thin',
            scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
          }}
        >
          <VStack spacing={1} align="stretch" pb={2}>
            {chats.map((chat) => {
              const chatType = CHAT_TYPES.find(t => t.value === parseInt(chat.type));
              const Icon = chatType?.icon || FaUsers;
              const colorScheme = chatType?.color || 'gray';
              
              return (
                <Flex
                  key={chat.id}
                  p={3}
                  borderRadius="lg"
                  cursor="pointer"
                  align="center"
                  bg={selectedChatId === chat.id ? selectedBg : 'transparent'}
                  _hover={{ bg: selectedChatId === chat.id ? selectedBg : bgHover }}
                  transition="background 0.2s ease"
                  onClick={() => onSelectChat(chat)}
                >
                  <Avatar
                    icon={<Icon />}
                    bg={`${colorScheme}.500`}
                    color="white"
                    size="md"
                    mr={3}
                  />
                  <Box flex="1" minW={0}>
                    <Flex align="center">
                      <Text 
                        fontWeight="bold" 
                        isTruncated
                        fontSize="md"
                      >
                        {chat.name}
                      </Text>
                      {chat.isPrivate && (
                        <Badge 
                          ml={2} 
                          colorScheme="yellow" 
                          fontSize="xs"
                        >
                          Приватный
                        </Badge>
                      )}
                    </Flex>
                    <Text 
                      fontSize="sm" 
                      color="gray.500"
                      isTruncated
                    >
                      {chat.lastMessage || 'Нет новых сообщений'}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

export default ChatList;