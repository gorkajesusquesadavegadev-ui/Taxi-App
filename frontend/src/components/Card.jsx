export default function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag className={`surface p-4 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
