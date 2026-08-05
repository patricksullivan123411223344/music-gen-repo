import PageShell from '../components/layout/PageShell.tsx';
import MidiSettingsSection from '../components/settings/MidiSettingsSection.tsx';
import MaxConfigPanel from '../components/max/MaxConfigPanel.tsx';
import { useMaxLink } from '../hooks/useMaxLink.ts';
import '../css/settings.css';
import '../css/midi.css';

const placeholderSections = [
  {
    title: 'Soloist defaults',
    items: ['Preferred instrument', 'Default style', 'Turn order'],
  },
  {
    title: 'Local presets',
    items: ['Named jam presets', 'Analysis history retention'],
  },
];

export default function SettingsPage() {
  const { envelope, pushMaxLink } = useMaxLink();

  return (
    <PageShell
      title="Settings"
      subtitle="Configure audio, MIDI devices, Max link, and soloist preferences."
    >
      <div className="settings-grid">
        <MidiSettingsSection />

        <MaxConfigPanel
          envelope={envelope}
          onRenderMode={(renderMode) => {
            void pushMaxLink({ renderMode });
          }}
          onSf2Preview={(sf2Preview) => {
            void pushMaxLink({ sf2Preview });
          }}
        />

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
