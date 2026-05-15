const redeemedContacts = new Map();

export function registerRedeemedContact(contact) {
  if (!contact?.id) return;
  redeemedContacts.set(String(contact.id), { ...contact, redeemed: true });
}

export async function getRedeemedContactById(contactId) {
  return redeemedContacts.get(String(contactId)) || null;
}

export function clearRedeemedContacts() {
  redeemedContacts.clear();
}

