function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildRdvEmailHtml(params: {
  demandeurName: string;
  destinataireName: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  baseUrl?: string;
}) {
  const { demandeurName, destinataireName, startsAt, endsAt, notes, status } = params;
  const baseUrl = params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://promote-connect.pro';

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Nouvelle demande de rendez-vous', color: '#f59e0b' },
    confirmed: { label: 'Rendez-vous confirmé', color: '#22c55e' },
    cancelled: { label: 'Rendez-vous annulé', color: '#ef4444' },
  };

  const cfg = statusConfig[status] || statusConfig.pending;

  const notesHtml = notes
    ? `
    <tr>
      <td style="padding:0 0 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
          <tr><td style="padding:16px">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;color:#92400e">Note :</p>
            <p style="margin:0;font-size:14px;color:#78350f;line-height:1.5">${notes}</p>
          </td></tr>
        </table>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <tr>
    <td style="background:#4A072B;padding:32px">
      <table role="presentation" width="100%">
        <tr>
          <td style="vertical-align:middle">
            <img src="${baseUrl}/pro_connect_fr.webp" width="180" height="auto" alt="PROMOTE-CONNECT" style="display:block;border:0" />
          </td>
        </tr>
        <tr>
          <td>
            <h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3">${cfg.label}</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 16px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 16px;background:#f6f8fb;border-radius:12px">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding:0 0 8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};vertical-align:middle;margin-right:8px"></span><span style="font-size:13px;font-weight:600;color:${cfg.color};vertical-align:middle">${cfg.label}</span></td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 12px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;border-radius:12px">
              <tr><td style="padding:16px">
                <table role="presentation" width="100%">
                  <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">De</td></tr>
                  <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${demandeurName}</td></tr>
                  <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">À</td></tr>
                  <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${destinataireName}</td></tr>
                  <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">Début</td></tr>
                  <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${formatDateTime(startsAt)}</td></tr>
                  <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">Fin</td></tr>
                  <tr><td style="font-size:15px;font-weight:600;color:#0f172a">${formatDateTime(endsAt)}</td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        ${notesHtml}
      </table>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">
        ${status === 'pending' ? 'Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande.' : ''}
        ${status === 'confirmed' ? 'Ce rendez-vous est confirmé. Vous recevrez un rappel avant l\'événement.' : ''}
        ${status === 'cancelled' ? 'Ce rendez-vous a été annulé.' : ''}
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#f6f8fb;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;color:#94a3b8">PROMOTE-CONNECT — Plateforme de networking professionnel</p>
      <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Conçu par <a href="https://bbit-it.com" style="color:#94a3b8;text-decoration:underline">BBIT Sarl</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
