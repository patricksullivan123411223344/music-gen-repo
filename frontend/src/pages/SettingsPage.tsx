import PageShell from '../components/layout/PageShell.tsx';
import MidiSettingsSection from '../components/settings/MidiSettingsSection.tsx';
import '../css/settings.css';
import '../css/midi.css';

const placeholderSections = [
  {
    title: 'Soloist defaults',
    items: ['Preferred instrument', 'Default style', 'Turn order'],
  },
  {
    title: 'Account',
    items: ['Email notifications', 'Practice history retention'],
  },
];

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      subtitle="Configure audio, MIDI devices, and soloist preferences."
    >
      <div className="settings-grid">
        <MidiSettingsSection />

        {placeholderSections.map((section) => (
          <section key={section.title} className="settings-card">
            <h2 className="settings-card__title">{section.title}</h2>
            <ul className="settings-card__list">
              {section.items.map((item) => (
                <li key={item} className="settings-row">
                  <span>{item}</span>
                  <span className="settings-row__badge">Soon</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
