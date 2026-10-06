/**
 * Birthday Experience - Recipient & Message Configuration
 * 
 * Edit this configuration to customize the recipient's details,
 * reveal subtitle, handwritten letter, and final closing message.
 */

export const BIRTHDAY_CONFIG = {
  // Recipient name shown during kinetic reveal and closing title
  recipientName: "chinna pulla",

  // Subtitle accompanying the kinetic typography reveal (Act 3)
  revealSubtitle: "to someone worth celebrating",

  // Personal handwritten letter configuration (Act 5)
  letter: {
    greeting: "Dear chinna pulla,",
    paragraphs: [
      "Happy Birthday! 🎉🎂",
      "Hope you have a super fun day filled with happiness, laughter, and lots of good memories. Wishing you all the best for the year ahead!",
      "Enjoy your day and keep smiling! 😊",
      "Happy Birthday once again! ❤️"
    ],
    closing: "",
    signature: "— Vignesh"
  },

  // Final closing screen message displayed over the blooming heart tree (Act 8)
  finalMessage: {
    hero: "Happy Birthday, chinna pulla! ❤️",
    lines: [
      "May your year bloom beautifully.",
      "Enjoy your day and keep smiling!",
      "Wishing you all the best for the year ahead!"
    ]
  }
};
