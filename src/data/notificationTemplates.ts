export interface NotificationTemplate {
  subject: string;
  body: string;
  type: "email" | "sms" | "whatsapp";
}

export const dropTemplates: Record<string, (productName: string, price: string, url: string) => NotificationTemplate> = {
  mysterious: (name, price, url) => ({
    type: "email",
    subject: "STILL FLY? NEW DROP DETECTED.",
    body: `
      [ INCOMING TRANSMISSION ]
      
      A new asset has been deployed to the 2FLY grid:
      NAME: ${name.toUpperCase()}
      VALUATION: ${price}
      
      Access restricted to the inner circle.
      Claim yours before the signal fades.
      
      VIEW DROP: ${url}
      
      2FLY DAILY® — FOREVA FLY.
    `,
  }),
  hype: (name, price, url) => ({
    type: "sms",
    subject: "2FLY DROP",
    body: `2FLY DROP: ${name.toUpperCase()} is LIVE. KES ${price}. Limited stock. Secure the fit now: ${url}`,
  }),
  premium: (name, price, url) => ({
    type: "whatsapp",
    subject: "New Arrival",
    body: `*2FLY DAILY® NEW DROP*\n\n*Product:* ${name}\n*Price:* ${price}\n\nElevate your everyday rotation. The latest drop is now available for deployment.\n\n*Secure yours:* ${url}`,
  })
};
