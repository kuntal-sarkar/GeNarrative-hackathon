import PolicyInfo from "../PolicyInfo";

const sections = [
  {
    "heading": "Contact channel",
    "text": "Email takegridai@gmail.com. This is the contact mailbox for the TakeGrid MVP and Team Runtime Error."
  },
  {
    "heading": "Safer communication",
    "text": "Do not email passwords, OTPs, API keys or authentication tokens. If reporting a vulnerability, share the minimum necessary details."
  }
];

export default function ContactSection() {
  return <PolicyInfo intro={"Official MVP contact for TakeGrid support, privacy inquiries, reports and feedback."} sections={sections} footer="Questions or concerns? Email" />;
}
