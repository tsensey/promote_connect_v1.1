export default function CredentialsEmail({
  fullName,
  email,
  password,
  role,
}: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) {
  const loginUrl = 'https://promote-connect.com/login';

  return (
    <div
      style={{
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#0f172a',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#ffffff', fontSize: '24px', margin: 0, fontWeight: 700 }}>
          PROMOTE-CONNECT
        </h1>
        <p style={{ color: '#c7d2fe', fontSize: '14px', margin: '8px 0 0' }}>
          Votre acces est pret
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '32px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 16px' }}>
          Bienvenue, {fullName}
        </h2>
        <p style={{ color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>
          Votre compte a ete cree par l administrateur PROMOTE-CONNECT.
          Vous pouvez des maintenant acceder a la plateforme.
        </p>

        {/* Credentials box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vos identifiants
          </h3>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Email</span>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 0', color: '#0f172a' }}>
              {email}
            </p>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Mot de passe</span>
            <p
              style={{
                fontSize: '15px',
                fontWeight: 600,
                margin: '4px 0 0',
                color: '#0f172a',
                fontFamily: 'monospace',
                background: '#e2e8f0',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'inline-block',
              }}
            >
              {password}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Role</span>
            <p style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 0', color: '#0f172a' }}>
              {role === 'exposant' ? 'Exposant' : 'Visiteur'}
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href={loginUrl}
          style={{
            display: 'block',
            textAlign: 'center',
            background: '#4f46e5',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Se connecter a PROMOTE-CONNECT
        </a>

        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: '24px 0 0' }}>
          Nous vous recommandons de changer votre mot de passe lors de votre premiere connexion.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '20px 32px',
          background: '#f8fafc',
          borderRadius: '0 0 16px 16px',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
          Ce mail a ete envoye automatiquement. Ne repondez pas a ce message.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '8px 0 0' }}>
          PROMOTE-CONNECT — Plateforme de networking professionnel
        </p>
      </div>
    </div>
  );
}
