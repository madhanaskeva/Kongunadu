import React from 'react';
import Input from '../common/Input';

export const FormDatePicker = ({ label, name, value, onChange, error, ...props }) => {
  return (
    <Input
      type="date"
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      {...props}
    />
  );
};

export default FormDatePicker;

