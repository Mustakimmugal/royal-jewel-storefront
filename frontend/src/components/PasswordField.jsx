import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordField({ id, name = "password", autoComplete, minLength, maxLength = 128, required = true }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} required={required} />
      <button className="password-toggle" type="button" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"}>
        {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
      </button>
    </div>
  );
}
