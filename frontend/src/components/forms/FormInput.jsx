import React from 'react';
import Input from '../common/Input';

export const FormInput = ({ label, name, value, onChange, error, ...props }) => {
  return (
    <Input
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      {...props}
    />
  );
};

export default FormInput;

