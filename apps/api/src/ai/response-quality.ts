import type { RelationshipState } from "@aether/shared";
export function scoreResponse(input: { response:string; relationship:RelationshipState; userMessage:string }) {
  const r = input.response.trim(); let s = 50;
  if (r.length < 20) s -= 30; if (r.length > 3200) s -= 12;
  if (/as an ai|language model|system prompt|i can.t roleplay|policy/i.test(r)) s -= 90;
  if (/rain|deszcz|shadow|cień|breath|oddech|light|światł|cold|warm|ciepł|window|okno/i.test(r)) s += 8;
  if (/hesitat|zawaha|quiet|cicho|soft|łagod|look|spojrz|voice|głos|silence|cisza/i.test(r)) s += 10;
  if (/again|znowu|earlier|wcześniej|remember|pamięta|ostatnio|last time/i.test(r)) s += 6;
  if (input.relationship.trust < 25 && /kocham cię|i love you/i.test(r)) s -= 25;
  if (input.relationship.tension > 65 && r.length < 1600) s += 5;
  return Math.max(0, Math.min(100, Math.round(s)));
}
