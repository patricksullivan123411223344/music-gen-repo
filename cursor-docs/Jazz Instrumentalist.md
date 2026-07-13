> **Original client brief (verbatim).** Structured docs: [01-app-overview.md](./01-app-overview.md) → [02-data-contracts.md](./02-data-contracts.md) → [03-frontend-architecture.md](./03-frontend-architecture.md) / [04-backend-architecture.md](./04-backend-architecture.md)

---

A real time adaptive jazz soloist that actively responds to live midi input material in order to generate solos.  This program should be able to transcribe and interpret midi input while having an awareness of important musical concepts and a general understanding of western music theory.  It should act similar to a live musical partner and practicing tool, being able to improvise intelligently sympathetic to what is being played in various situations.  Also, this program should be able to interpret a standard chord chart and properly play over it, by itself and with others, in careful consideration of standard practice.  The program will be able to trade measured choruses of whatever tune is specified by the chord chart with various instruments, and create a modular backing track for both the player and the soloist to perform over.

The most important current features are:
1. The improvising soloist.  The soloist will generate music based on two main things, the input information through midi (especially for rhythmic and harmonic patterns), and it's respect to proper jazz harmony (playing the right notes over the right chords).  It should be fixed in time with the backing track, and able to play a chorus (one time through the chord chart) where at the end it properly resolves as to not get cut off by the player.  Right now, one can select which instrument they want this program to use (jazz instruments such as trumpet, saxophone, piano, guitar, etc.).  The jazz soloist also should be coded to not overuse dissonant intervals and strange rhythms.  At the moment, when requested, the soloist can play first, generating a proper melody for the player to respond to, beginning the conversation.  A general focus on this interplay between both parties is very important.
In my current mockup of the app, there are modifiers for how the bot plays, such as style (bebop, lyrical, outside) and an option for who starts first ( the player or the soloist).

2.  The backing track generator.  The program generates a backing track based on the chord chart supplied to it. There are various options for styles here (Bebop, Swing, Latin, Bossa Nova, Straight), and it is made up of various standard jazz rhythm instruments (Upright Bass, Drums) and comping(harmonic) instruments (Piano, guitar, vibraphone.)  The backing track will run in the background while the soloist and they player take turns.  At the moment, there are also random drum fills and variations to keep the track something more than completely passive and boring.  There is also a form clock which goes along with this, which tracks the length of the form in beats and seconds, in order to allow one to see when they should start at the top of the form, and to assure that the soloist is starting and stopping at the right time.  

3.  Solo analysis.  The program has the ability to notate and describe each solo.  It shows the scale degrees of the notes as they apply over each chord of the form, and assumes their function as chord tones, consonant color tones, and dissonant tension tones.  It visually can express this in standard notation or something like piano roll.  

As far as future features go, the program should probably have an interactive and comprehensive backing track system that is as moldable and communicative as the soloist, as to have an entire band of functional musical players.  This will probably be most feasible if we go in the direction of the paper that Callum found, with the diffusion AI, as samples will only go so far when a whole programmed band is playing at once with a human player.  The analysis in late stage will be a good tool for someone who is practicing and wants to look back at their solos.  
Also, something else further down the line could be the capacity to transcribe non-midi instruments as well.  I was spitballing here with something like Spotify Basic Pitch to do this, as it would allow for a greater variety of instruments to be compatible if played into a microphone.  

The real end goal image I have is various real people playing cooperatively with this program and having a successful jam sesh.

Some good musical jargon to know is:

Key center — The pitch or chord that feels like the tonal center at a given moment.

Chord chart — A shorthand map of a song’s chords over time, often with bar lines and section labels.

Chord progression — A sequence of chords.

Chord symbol — A compact label for a chord, like Dm7, G7alt, or Cmaj7.

Resolution — When musical tension moves to a more stable sound.

Chord tones — Notes that belong directly to the current chord.

Form — The full structure of a tune, (blues / jazz blues is a really important one to know about)

Beat — The basic pulse.

Motif — A short, recognizable musical idea. (what the program will take from the player and develop in their solo)








