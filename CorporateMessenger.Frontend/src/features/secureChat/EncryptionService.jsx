import CryptoJS from 'crypto-js';
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
    cryptoKeyPair: keyPair, // Сохраняем для deriveKey
  };
};

export const computeSharedSecret = async (myPrivateKey, otherPublicKey) => {
  const myPrivateKeyBuffer = base64ToArrayBuffer(myPrivateKey);
  const otherPublicKeyBuffer = base64ToArrayBuffer(otherPublicKey);
  const myPrivateKeyCrypto = await window.crypto.subtle.importKey(
    "pkcs8",
    myPrivateKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const otherPublicKeyCrypto = await window.crypto.subtle.importKey(
    "spki",
    otherPublicKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
  const sharedSecret = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: otherPublicKeyCrypto,
    },
    myPrivateKeyCrypto,
    256
  );
  return arrayBufferToBase64(sharedSecret);
};

export const deriveAESKey = async (sharedSecret) => {
  const sharedSecretBuffer = base64ToArrayBuffer(sharedSecret);
  return await window.crypto.subtle.importKey(
    "raw",
    sharedSecretBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (data, aesKey) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    dataBuffer
  );
  const encryptedArray = new Uint8Array(encrypted);
  const tag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);
  return {
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    iv: arrayBufferToBase64(iv),
    tag: arrayBufferToBase64(tag.buffer),
  };
};

export const encryptFile = async (file, aesKey) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const data = new Uint8Array(reader.result);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          aesKey,
          data
        );
        const encryptedArray = new Uint8Array(encrypted);
        const tag = encryptedArray.slice(-16);
        const ciphertext = encryptedArray.slice(0, -16);
        resolve({
          ciphertext: arrayBufferToBase64(ciphertext.buffer),
          iv: arrayBufferToBase64(iv),
          tag: arrayBufferToBase64(tag.buffer),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const decryptData = async (encryptedData, aesKey) => {
  const { ciphertext, iv, tag } = encryptedData;
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);
  const tagBuffer = base64ToArrayBuffer(tag);
  const fullEncrypted = new Uint8Array(ciphertextBuffer.byteLength + tagBuffer.byteLength);
  fullEncrypted.set(new Uint8Array(ciphertextBuffer), 0);
  fullEncrypted.set(new Uint8Array(tagBuffer), ciphertextBuffer.byteLength);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      aesKey,
      fullEncrypted.buffer
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    return '[Ошибка дешифрования]';
  }
};

export const decryptFile = async (encryptedData, aesKey, fileType) => {
  const { ciphertext, iv, tag } = encryptedData;
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);
  const tagBuffer = base64ToArrayBuffer(tag);
  const fullEncrypted = new Uint8Array(ciphertextBuffer.byteLength + tagBuffer.byteLength);
  fullEncrypted.set(new Uint8Array(ciphertextBuffer), 0);
  fullEncrypted.set(new Uint8Array(tagBuffer), ciphertextBuffer.byteLength);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      aesKey,
      fullEncrypted.buffer
    );
    return new Blob([decrypted], { type: fileType });
  } catch (err) {
    throw new Error('Не удалось расшифровать файл');
  }
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};