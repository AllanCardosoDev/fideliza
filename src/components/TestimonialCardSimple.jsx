import React from "react";

export default function TestimonialCardSimple({
  quote = "",
  author = "Usuário",
  role = "",
  avatar = "/logo.jpeg",
}) {
  return (
    <div className="testimonial-card glass-card">
      <div className="testimonial-quote">“{quote}”</div>

      <div className="testimonial-author">
        <img src={avatar} alt={author} className="testimonial-avatar" />
        <div className="testimonial-meta">
          <div className="testimonial-name">{author}</div>
          <div className="testimonial-role">{role}</div>
        </div>
      </div>
    </div>
  );
}
