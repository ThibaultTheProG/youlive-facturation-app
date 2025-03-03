export async function hashPassword(password: string): Promise<string> {
    const response = await fetch('/api/auth/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action: 'hash' })
    });
    const data = await response.json();
    return data.hash;
  }
  
  export async function comparePassword(password: string, hash: string): Promise<boolean> {
    const response = await fetch('/api/auth/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, hash, action: 'compare' })
    });
    const data = await response.json();
    return data.isValid;
  }