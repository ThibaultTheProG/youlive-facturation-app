import bcryptjs from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  // Vérifier si nous sommes côté serveur (pas de window)
  if (typeof window === 'undefined') {
    // Côté serveur: utiliser bcryptjs directement
    const salt = bcryptjs.genSaltSync(10);
    return bcryptjs.hashSync(password, salt);
  } else {
    // Côté client: utiliser l'API
    const response = await fetch('/api/auth/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'hash' })
    });
    const data = await response.json();
    return data.hash;
  }
}
  
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // Vérifier si nous sommes côté serveur (pas de window)
  if (typeof window === 'undefined') {
    // Côté serveur: utiliser bcryptjs directement
    return bcryptjs.compareSync(password, hash);
  } else {
    // Côté client: utiliser l'API
    const response = await fetch('/api/auth/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, hash, action: 'compare' })
    });
    const data = await response.json();
    return data.isValid;
  }
}