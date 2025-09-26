const CryptoJS = require('crypto-js');

function encryptToken(token) {
  const encrypted = CryptoJS.AES.encrypt(token, process.env.ENCRYPTION_KEY).toString();
  return encrypted;
}

function decryptToken(encryptedToken) {
  const decrypted = CryptoJS.AES.decrypt(encryptedToken, process.env.ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

module.exports = {
  encryptToken,
  decryptToken
};