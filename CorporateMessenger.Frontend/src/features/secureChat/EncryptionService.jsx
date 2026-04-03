export class EncryptionService {
  // Генерация пары ключей ECDH (P-256)
  static async generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true, // извлекаемые ключи
      ["deriveKey"] // использование для вычисления общего секрета
    );
    return keyPair;
  }

  // Экспорт публичного ключа в Base64
  static async exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  static async importPublicKey(base64PublicKey) {
    try {
      // Проверяем, что это строка и не пустая
      if (typeof base64PublicKey !== 'string' || !base64PublicKey.trim()) {
        throw new Error('Public key must be a non-empty string');
      }

      // Удаляем возможные пробелы и преобразуем в стандартный Base64
      const cleanBase64 = base64PublicKey.trim()
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Декодируем Base64
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return await window.crypto.subtle.importKey(
        "spki",
        bytes,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );
    } catch (error) {
      console.error('Error importing public key:', error);
      throw new Error('Failed to import public key: ' + error.message);
    }
  }

  static async deriveSharedSecret(privateKey, publicKey) {
    try {
      if (publicKey instanceof CryptoKey) {
        return await window.crypto.subtle.deriveKey(
          {
            name: "ECDH",
            public: publicKey,
          },
          privateKey,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
      }

      // Если publicKey в формате Base64 строки
      const importedPublicKey = await this.importPublicKey(publicKey);
      return await window.crypto.subtle.deriveKey(
        {
          name: "ECDH",
          public: importedPublicKey,
        },
        privateKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    } catch (error) {
      console.error('Error deriving shared secret:', error);
      throw new Error('Failed to derive shared secret: ' + error.message);
    }
  }

  static async encryptData(sharedSecret, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    let encodedData;
    
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      encodedData = encoder.encode(data);
    } else {
      encodedData = data;
    }
  
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      sharedSecret,
      encodedData
    );
  
    return {
      iv: iv,
      ciphertext: new Uint8Array(encrypted),
      tag: new Uint8Array(encrypted.slice(-16)) // GCM tag (16 байт)
    };
  }
  // Дешифрование данных
  static async decryptData(sharedSecret, encryptedData, iv) {
    const ivBytes = new Uint8Array(atob(iv).split("").map(char => char.charCodeAt(0)));
    const dataBytes = new Uint8Array(atob(encryptedData).split("").map(char => char.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      sharedSecret,
      dataBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}