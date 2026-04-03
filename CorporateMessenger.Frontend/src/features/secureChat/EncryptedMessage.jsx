import { useState, useEffect } from 'react';
import { Box, Text, HStack, Avatar, Badge, Tooltip } from '@chakra-ui/react';
import { EncryptionService } from './EncryptionService';
import { FaLock, FaUserCircle } from 'react-icons/fa';

function EncryptedMessage({ activity, aesKey, userId }) {
  const [decryptedText, setDecryptedText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptionError, setDecryptionError] = useState(false);

  useEffect(() => {
    decryptMessage();
  }, [activity, aesKey]);

  const decryptMessage = async () => {
    if (!aesKey) {
      setDecryptedText('[Нет ключа шифрования]');
      setIsDecrypting(false);
      setDecryptionError(true);
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(false);
    
    try {
      // Проверяем формат данных
      if (!activity.data?.encryptedData || !activity.data?.iv) {
        throw new Error('Неверный формат зашифрованных данных');
      }

      const text = await EncryptionService.decryptData(
        aesKey, 
        activity.data.encryptedData, 
        activity.data.iv
      );
      setDecryptedText(text);
    } catch (error) {
      console.error('Error decrypting message:', error);
      setDecryptedText('[Ошибка расшифровки]');
      setDecryptionError(true);
    } finally {
      setIsDecrypting(false);
    }
  };

  const isOwn = activity.data?.sender?.id === userId || activity.senderId === userId;
  const senderName = activity.data?.sender 
    ? `${activity.data.sender.firstName || ''} ${activity.data.sender.lastName || ''}`.trim()
    : activity.senderName || 'Неизвестный';

  return (
    <Box
      bg={isOwn ? 'blue.500' : 'white'}
      color={isOwn ? 'white' : 'gray.800'}
      p={4}
      borderRadius="xl"
      maxW="75%"
      alignSelf={isOwn ? 'flex-end' : 'flex-start'}
      boxShadow={isOwn ? 'md' : 'sm'}
      border={isOwn ? 'none' : '1px solid'}
      borderColor={isOwn ? 'transparent' : 'gray.200'}
      position="relative"
      _hover={{ shadow: 'lg' }}
      transition="all 0.2s"
    >
      {/* Индикатор шифрования */}
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          {!isOwn && (
            <>
              <Avatar 
                size="xs" 
                name={senderName}
                bg={isOwn ? 'blue.200' : 'green.200'}
                color={isOwn ? 'blue.800' : 'green.800'}
                icon={<FaUserCircle />}
              />
              <Text fontSize="xs" fontWeight="semibold" opacity={0.8}>
                {senderName}
              </Text>
            </>
          )}
        </HStack>
        
        <Tooltip label="End-to-End шифрование" placement="top">
          <Badge 
            colorScheme={decryptionError ? 'red' : 'green'} 
            fontSize="0.6em"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <FaLock />
            E2E
          </Badge>
        </Tooltip>
      </HStack>

      {/* Текст сообщения */}
      {isDecrypting ? (
        <Text fontStyle="italic" opacity={0.7}>
          Расшифровка...
        </Text>
      ) : decryptionError ? (
        <Text color={isOwn ? 'yellow.200' : 'red.500'} fontStyle="italic">
          {decryptedText}
        </Text>
      ) : (
        <Text whiteSpace="pre-wrap" wordBreak="break-word" lineHeight="1.5">
          {decryptedText}
        </Text>
      )}

      {/* Время отправки */}
      <HStack justify="flex-end" mt={2} spacing={2}>
        <Text 
          fontSize="xs" 
          opacity={isOwn ? 0.7 : 0.5}
        >
          {activity.timestamp 
            ? new Date(activity.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
          }
        </Text>
        {!isOwn && (
          <Text fontSize="xs" opacity={0.5}>
            {senderName}
          </Text>
        )}
      </HStack>
    </Box>
  );
}

export default EncryptedMessage;