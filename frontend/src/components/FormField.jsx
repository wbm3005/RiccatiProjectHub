import { Children, cloneElement, isValidElement, useId, useState } from "react";

/** One label/control pair with native validation feedback, usable without API changes. */
export default function FormField({ children, ...props }) {
 const generated = useId();
 const [error, setError] = useState("");
 const items = Children.toArray(children);
 const control = items.find(c => isValidElement(c) && ["input", "select", "textarea"].includes(c.type));
 if (!control) return <div {...props}>{children}</div>;
 const id = control.props.id || generated;
 const errorId = id + "-error";
 return <div {...props}>{items.map(child => {
  if (!isValidElement(child)) return child;
  if (child.type === "label") return cloneElement(child, {htmlFor:id}, child.props.children, control.props.required && !Children.toArray(child.props.children).filter(c => typeof c === "string").join("").includes("*") ? <span aria-hidden="true"> *</span> : null);
  if (child !== control) return child;
  return cloneElement(child, {id, "aria-invalid":error ? true : undefined, "aria-describedby":[control.props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined,
   onInvalid:e => {setError(e.target.validationMessage); control.props.onInvalid?.(e);},
   onChange:e => {if(error)setError(e.target.validity.valid ? "" : e.target.validationMessage);control.props.onChange?.(e);}
  });
 })}{error && <span id={errorId} className="rp-field-error" role="alert">{error}</span>}</div>;
}
