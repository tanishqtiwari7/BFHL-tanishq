import { isPrime } from "../utils/prime.js";
import { parseBase64File } from "../utils/file.js";

const userId = process.env.USER_ID || "john_doe_17091999";
const email = process.env.EMAIL || "john@xyz.com";
const rollNumber = process.env.ROLL_NUMBER || "ABCD123";

const isSingleAlphabet = (value) => {
  if (typeof value !== "string" || value.length !== 1) {
    return false;
  }

  return /[A-Za-z]/.test(value);
};

const isNumericString = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  return !Number.isNaN(Number(value));
};

const getHighestLowercase = (alphabets) => {
  const lowercase = alphabets.filter((item) => item >= "a" && item <= "z");

  if (!lowercase.length) {
    return [];
  }

  let highest = lowercase[0];
  for (const letter of lowercase) {
    if (letter > highest) {
      highest = letter;
    }
  }

  return [highest];
};

export const getBfhl = (req, res) => {
  res.status(200).json({ operation_code: 1 });
};

export const postBfhl = async (req, res) => {
  try {
    const data = Array.isArray(req.body?.data) ? req.body.data : null;
    const fileValue = req.body?.file_b64;

    if (!data) {
      return res.status(200).json({
        is_success: false,
        user_id: userId,
        email,
        roll_number: rollNumber,
        numbers: [],
        alphabets: [],
        highest_lowercase_alphabet: [],
        is_prime_found: false,
        file_valid: false,
        file_mime_type: null,
        file_size_kb: null,
      });
    }

    const numbers = data
      .filter(isNumericString)
      .map((value) => value.toString());
    const alphabets = data
      .filter(isSingleAlphabet)
      .map((value) => value.toString());

    const isPrimeFound = numbers.some((value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && isPrime(parsed);
    });

    const { fileValid, fileMimeType, fileSizeKb } =
      await parseBase64File(fileValue);

    res.status(200).json({
      is_success: true,
      user_id: userId,
      email,
      roll_number: rollNumber,
      numbers,
      alphabets,
      highest_lowercase_alphabet: getHighestLowercase(alphabets),
      is_prime_found: isPrimeFound,
      file_valid: fileValid,
      file_mime_type: fileMimeType,
      file_size_kb: fileSizeKb,
    });
  } catch (error) {
    res.status(200).json({
      is_success: false,
      user_id: userId,
      email,
      roll_number: rollNumber,
      numbers: [],
      alphabets: [],
      highest_lowercase_alphabet: [],
      is_prime_found: false,
      file_valid: false,
      file_mime_type: null,
      file_size_kb: null,
    });
  }
};
