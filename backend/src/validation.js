const NAME_MIN = 20;
const NAME_MAX = 60;
const ADDRESS_MAX = 400;

export function validateName(name) {
  if (!name) return 'Name is required';
  if (name.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters`;
  if (name.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters`;
  return null;
}

export function validateAddress(address) {
  if (!address) return 'Address is required';
  if (address.length > ADDRESS_MAX) return `Address must be at most ${ADDRESS_MAX} characters`;
  return null;
}

export function validateEmail(email) {
  if (!email) return 'Email is required';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'Email is invalid';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8 || password.length > 16) {
    return 'Password must be 8-16 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character';
  }
  return null;
}

export function collectValidationErrors(fields) {
  const errors = {};
  Object.entries(fields).forEach(([key, fn]) => {
    const error = fn();
    if (error) errors[key] = error;
  });
  return Object.keys(errors).length ? errors : null;
}

