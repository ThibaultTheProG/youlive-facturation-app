import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <nav>Conseiller Navigation</nav>
      <main>{children}</main>
    </div>
  );
}