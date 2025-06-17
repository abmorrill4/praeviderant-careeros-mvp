
import { useState } from "react";

export const useEmailValidation = () => {
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  const handleEmailBlur = (email: string) => {
    if (email && !isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const clearEmailError = () => {
    setEmailError("");
  };

  return {
    emailError,
    validateEmail,
    handleEmailBlur,
    clearEmailError,
  };
};
