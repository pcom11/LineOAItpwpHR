export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '64px 24px',
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>LINE OA ITPWP HR</h1>
      <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
        Webhook bridge between LINE Official Account and Google Gemini.
      </p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Endpoint</h2>
        <code
          style={{
            display: 'inline-block',
            padding: '6px 10px',
            borderRadius: 6,
            background: '#1a2240',
            color: '#9ec8ff',
          }}
        >
          POST /api/line-webhook
        </code>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Status</h2>
        <p style={{ opacity: 0.8 }}>Deployment is live. Configure the webhook URL in LINE Developers.</p>
      </section>
    </main>
  );
}
