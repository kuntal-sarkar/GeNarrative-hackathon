import "./LegalContent.css";

export default function PolicyInfo({ intro, sections, footer }) {
  return <article className="tg-legal-content">
    <p className="tg-legal-date">Updated: November 15, 2026 · TakeGrid MVP</p>
    <p className="tg-legal-intro">{intro}</p>
    {sections.map(({ heading, text, bullets }) => <section key={heading}>
      <h2>{heading}</h2>
      {text && <p>{text}</p>}
      {bullets?.length > 0 && <ul>{bullets.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>)}
    {footer && <p className="tg-legal-callout">{footer} <a href="mailto:takegridai@gmail.com">takegridai@gmail.com</a>.</p>}
  </article>;
}
