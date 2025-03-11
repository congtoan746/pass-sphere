import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { _SERVICE } from "declarations/pass_sphere_backend/pass_sphere_backend.did";
import * as vetkd from "ic-vetkd-utils";

export const getAES256GCMKey = async ({
  principal,
  actor,
}: {
  principal: Principal;
  actor: ActorSubclass<_SERVICE>;
}) => {
  const seed = window.crypto.getRandomValues(new Uint8Array(32));

  const tsk = new vetkd.TransportSecretKey(seed);

  const ekBytesHex =
    await actor.encrypted_symmetric_key_for_caller(
      tsk.public_key(),
    );
  const pkBytesHex = await actor.symmetric_key_verification_key();

  return tsk.decrypt_and_hash(
    hexDecode(ekBytesHex),
    hexDecode(pkBytesHex),
    principal.toUint8Array(),
    32,
    new TextEncoder().encode("aes-256-gcm"),
  );
};

export const aesGcmEncrypt = async (message: string, rawKey: BufferSource) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
  const aes_key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const message_encoded = new TextEncoder().encode(message);
  const cipherTextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aes_key,
    message_encoded,
  );
  const cipherText = new Uint8Array(cipherTextBuffer);
  var ivAndCipherText = new Uint8Array(iv.length + cipherText.length);
  ivAndCipherText.set(iv, 0);
  ivAndCipherText.set(cipherText, iv.length);

  return hexEncode(ivAndCipherText);
};

export const aesGcmDecrypt = async (
  cipherTextHex: string,
  rawKey: BufferSource,
) => {
  const ivAndCipherText = hexDecode(cipherTextHex);
  const iv = ivAndCipherText.subarray(0, 12); // 96-bits; unique per message
  const cipherText = ivAndCipherText.subarray(12);
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  console.log('aes_key', aesKey)

  let decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    cipherText,
  );

  return new TextDecoder().decode(decrypted);
};

export const hexDecode = (hexString: string) =>
  Uint8Array.from(
    (hexString.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16)),
  );

export const hexEncode = (bytes: Uint8Array) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
