export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

export const isValidPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10;
};

export const isValidVehicleNumber = (number) => {
  return /^[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{4}$/i.test(String(number).trim());
};

export const isPositiveNumber = (val) => {
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

export const validateTripEdit = (form) => {
  const errors = {};
  if (form.startKm !== undefined && !isPositiveNumber(form.startKm)) {
    errors.startKm = 'Start KM must be a valid positive number';
  }
  if (form.closeKm !== undefined && form.closeKm !== '' && Number(form.closeKm) < Number(form.startKm)) {
    errors.closeKm = 'Closing KM cannot be less than Start KM';
  }
  return errors;
};

