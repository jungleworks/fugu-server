module.exports = (length, isNumbersOnly) => {
  let charsNumbers = '0123456789';
  let charsLower = 'abcdefghijklmnopqrstuvwxyz';
  let charsUpper = charsLower.toUpperCase();
  let chars;

  if (isNumbersOnly) { chars = charsNumbers; } else { chars = charsNumbers + charsLower + charsUpper; }

  if (!length) length = 32;

  let string = '';
  for (let i = 0; i < length; i++) {
    let randomNumber = random(0, chars.length);
    randomNumber = randomNumber || 1;
    string += chars.substring(randomNumber - 1, randomNumber);
  }
  return string;
};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}