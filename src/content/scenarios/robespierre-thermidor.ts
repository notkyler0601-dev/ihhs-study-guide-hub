// Branching scenario tree for "You are Robespierre on 9 Thermidor".
//
// Used by <BranchingScenario />. The shape is engine-agnostic, so this can be
// swapped for compiled-Ink JSON later without touching the runtime.
//
// Historical setting: Paris, July 27, 1794 (9 Thermidor Year II of the
// French Revolutionary calendar). Robespierre has dominated the Committee
// of Public Safety since mid-1793 and has driven the Reign of Terror,
// purging the Hebertists in March 1794 and the Dantonists in April. After
// six weeks of brooding withdrawal, he returns to the Convention on
// 8 Thermidor and delivers a long speech vaguely accusing unnamed
// conspirators of treason. His refusal to name them terrifies the deputies,
// who assume they are on the list. That night, Tallien, Fouche, Barras,
// Billaud-Varenne, and Collot d'Herbois conspire against him.
//
// On 9 Thermidor, Robespierre and Saint-Just enter the Convention.
// Saint-Just tries to speak and is shouted down. Tallien denounces "the
// tyrant." Robespierre attempts the rostrum; his voice fails. A deputy
// cries, "The blood of Danton chokes him!" The chamber votes for arrest.
// He is taken to the Luxembourg, then sheltered at the Hotel de Ville by
// the Paris Commune. The Convention declares him outlaw. National Guard
// forces under Barras storm the Hotel de Ville before dawn on 10 Thermidor.
// Robespierre's jaw is shattered, debated as a self-inflicted suicide
// attempt or a soldier's pistol shot during arrest. He is guillotined that
// afternoon (July 28, 1794) along with twenty-one others.
//
// The tree below offers the historically accurate path plus four
// counterfactual branches, each annotated with a historicalNote that
// either explains what really happened or notes how that alternate would
// have plausibly played out.

const robespierreTree = {
  start: 'start',
  nodes: {
    start: {
      scenario:
        'It is the morning of 9 Thermidor, Year II (July 27, 1794). Yesterday you delivered a long speech accusing unnamed conspirators in the Convention of treason. Tonight Tallien, Fouche, Barras, and Billaud-Varenne are coordinating against you. Saint-Just is at your side, drafting a reply. The Convention reconvenes in three hours. What do you do?',
      choices: [
        { text: 'Go to the Convention with Saint-Just. Defend yourself and name the conspirators directly.', next: 'defiantNaming' },
        { text: 'Send a calm appeal for unity, blaming "factions" without naming them, hoping to disarm the plot.', next: 'conciliatoryGambit' },
        { text: 'Skip the Convention. Go straight to the Hotel de Ville and rally the Paris Commune for an insurrection.', next: 'rallyCommune' },
        { text: 'Order a small detachment of loyal Jacobin guards to arrest Tallien, Fouche, and Barras at dawn, before they can speak.', next: 'preemptive' },
      ],
    },

    defiantNaming: {
      scenario:
        'You enter the Convention. Saint-Just rises first and reads three lines before Tallien interrupts, brandishing a dagger and denouncing "the tyrant." The chamber roars. You climb to the rostrum. A deputy cries, "The blood of Danton chokes him!" Your voice fails in your throat. The president rings the bell against you. You have one more chance to be heard.',
      choices: [
        { text: 'Force the speech through, voice cracking. Name Tallien, Fouche, Barras as British agents.', next: 'arrestVote' },
        { text: 'Climb to the higher gallery and address the public seats over the deputies\' heads.', next: 'altSuccessfulSpeech' },
        { text: 'Withdraw with Saint-Just before the arrest motion is voted. Go to the Hotel de Ville now.', next: 'hotelDeVille' },
      ],
    },

    conciliatoryGambit: {
      scenario:
        'You appear in the Convention without your usual escort. You speak softly. You blame "unnamed factions" but extend a hand to "all sincere republicans." For a moment the chamber wavers. Then Tallien rises. He has been waiting for this exact opening. "The mask of moderation," he calls it. The denunciation lands harder for being unanswered.',
      choices: [
        { text: 'Press the conciliatory line. Offer to resign from the Committee of Public Safety in exchange for peace.', next: 'historicalCanonical' },
        { text: 'Drop the act. Switch mid-speech to direct attack on the conspirators.', next: 'arrestVote' },
        { text: 'Walk out of the chamber while you still can. Make for the Hotel de Ville.', next: 'hotelDeVille' },
      ],
    },

    arrestVote: {
      scenario:
        'The Convention votes for your arrest by acclamation. Gendarmes lead you out with Saint-Just, Couthon, and your brother Augustin. You are taken first toward the Luxembourg prison, but the jailer, a secret friend, refuses to admit you. A coach from the Paris Commune appears in the street, with armed men loyal to you. The night air is hot. The decision is now.',
      choices: [
        { text: 'Refuse the rescue. Surrender with dignity. Trust the Convention to grant a fair trial.', next: 'historicalPassive' },
        { text: 'Get in the coach. Go to the Hotel de Ville. The Commune is rising for you.', next: 'hotelDeVille' },
        { text: 'Slip away alone in the confusion. Vanish into the back streets.', next: 'altHide' },
      ],
    },

    hotelDeVille: {
      scenario:
        'You arrive at the Hotel de Ville under torchlight. The Commune has declared for you. Hanriot, your loyal National Guard commander, is mobilizing battalions in the Place de Greve. But the Convention has just declared you and your allies outlaws, meaning any citizen may shoot you on sight. A draft proclamation calling for armed insurrection lies on the table. It only needs your signature. Outside, a heavy summer rain has just begun, and the unpaid sans-culotte battalions are drifting home.',
      choices: [
        { text: 'Sign the call to insurrection. Lead the Commune against the Convention by force of arms.', next: 'altInsurrectionWin' },
        { text: 'Refuse to sign. You will not be the man who turns Paris into a battlefield. Wait. Hope the city rises of its own accord.', next: 'historicalCanonical' },
        { text: 'Slip out the back before Barras\'s forces arrive. The provinces still respect your name.', next: 'altHide' },
      ],
    },

    preemptive: {
      scenario:
        'You order Hanriot to arrest Tallien, Fouche, and Barras at their lodgings before dawn. The detachment moves at three in the morning. Tallien is taken in his nightshirt; Fouche resists and is wounded; Barras escapes through a courtyard but is caught at the Pont Neuf. By sunrise all three are in the Conciergerie. The Convention assembles in shock. What is the disposition of the prisoners?',
      choices: [
        { text: 'Have them executed within the hour, without trial, under the Law of 22 Prairial.', next: 'altCounterCoup' },
        { text: 'Have them tried by the Revolutionary Tribunal this afternoon. Public, fast, lawful.', next: 'altCounterCoup' },
        { text: 'Cancel the arrests. You cannot become the tyrant they accuse you of being. Release them.', next: 'arrestVote' },
      ],
    },

    rallyCommune: {
      scenario:
        'You go straight to the Hotel de Ville at dawn, skipping the Convention. The Commune cheers; the bells of the city ring the tocsin. Hanriot rallies the National Guard. But your physical absence from the Convention floor lets the conspirators carry the chamber by acclamation in under an hour. The outlaw decree is on the streets by noon. Without a dramatic stand to point to, without your voice in the chamber, the popular rising you hoped for fizzles. The rain begins.',
      choices: [
        { text: 'Sign the insurrection call. Commit to street fighting.', next: 'altInsurrectionWin' },
        { text: 'Hold the Hotel de Ville and wait. Hope the sections rise.', next: 'historicalCanonical' },
        { text: 'Flee the city before the cordon closes. Make for Arras, your home country.', next: 'altHide' },
      ],
    },

    historicalCanonical: {
      scenario:
        'At about two in the morning on 10 Thermidor, Barras and a detachment of National Guards from loyal Convention sections breach the Hotel de Ville. A pistol shot in the chamber. Your jaw shatters. You will be tied to a plank in the Tuileries that day, jaw bandaged, unable to speak. At about six in the evening on 10 Thermidor (July 28, 1794), the cart takes you to the Place de la Revolution. Twenty-one others ride with you. The crowd cheers as the blade falls.',
      ending: 'guillotined',
      historicalNote:
        'This is exactly what happened. Robespierre refused to sign the Commune\'s insurrection call, the rain dispersed the sans-culotte battalions, Barras stormed the Hotel de Ville at around 2 AM on 10 Thermidor, and Robespierre\'s jaw was shattered, by his own hand or a soldier\'s pistol, historians still debate which. He was guillotined on the afternoon of July 28, 1794, along with Saint-Just, Couthon, his brother Augustin, Hanriot, and seventeen others. The Reign of Terror ended within days. The Thermidorian Reaction began.',
    },

    historicalPassive: {
      scenario:
        'You wave off the Commune coach. The gendarmes take you to the Luxembourg, then, when the jailer refuses, to the Conciergerie. The Convention\'s decree of outlawry is read at noon on 10 Thermidor. There is no trial: an outlaw needs none. By evening you are on the cart with Saint-Just. The crowds line the Rue Saint-Honore. The blade falls in the Place de la Revolution at about six in the evening, July 28, 1794.',
      ending: 'guillotined',
      historicalNote:
        'A small variation on the actual ending. In real history, Robespierre did briefly accept arrest before being rescued by the Commune. Had he simply submitted, the result would have been identical: the Convention had already moved past trial and toward outlawry, and outlaws were guillotined within twenty-four hours of identification.',
    },

    altSuccessfulSpeech: {
      scenario:
        'You climb past the rostrum to the higher gallery, putting yourself above the deputies and addressing the packed public seats directly. "Citizens of Paris," you cry, "they want my head because I will name them. Hear me name them now!" For a moment the gallery roars its approval. Tallien hesitates. Then the moment passes. The Convention regains the floor. The arrest motion still passes, but the Commune\'s rising the next day is broader and more disciplined. You are still arrested. The outcome is unchanged.',
      ending: 'guillotined (alt history, partial)',
      historicalNote:
        'This branch is counterfactual. In real history, Robespierre tried four times to be heard and was shouted down each time. The fundamental problem was not rhetorical: the Convention had decided in advance that he must fall. Even a brilliant speech would not have changed the vote. The chamber was a coordination problem, and the conspirators had solved it the night of 8 Thermidor. By the time Robespierre stood up on 9 Thermidor, the result was already fixed.',
    },

    altCounterCoup: {
      scenario:
        'By the afternoon of 9 Thermidor, Tallien, Fouche, and Barras are dead. Their heads are on pikes outside the Conciergerie. The Convention, terrified, votes anything you ask. Saint-Just becomes effectively prime minister. The Terror not only continues, it intensifies. Within months, even loyal Jacobins begin to fear that the Republic of Virtue has become the rule of one man. The army, increasingly under General Bonaparte\'s rising shadow in Italy, watches and waits. Your government does not fall in 1794. It falls in 1795 or 1796 instead, and harder.',
      ending: 'counter-coup (alt history)',
      historicalNote:
        'This did not happen, and almost certainly could not have. Robespierre\'s entire political identity was legalism: he prosecuted enemies through the Revolutionary Tribunal, never by direct fiat. He famously refused to use the Committee of General Security as a personal police force. A pre-emptive arrest of fellow deputies without a vote of the Convention would have shattered the legitimacy he depended on, and would have given the army a reason to intervene a year sooner than it actually did under Bonaparte in Brumaire 1799.',
    },

    altHide: {
      scenario:
        'You vanish into the back streets of Paris. A sympathetic baker in the Faubourg Saint-Antoine hides you in a flour cellar for three days. Then a wagon takes you north toward Arras, where you grew up. For two months you live in a peasant\'s loft, reading and waiting for word that the Thermidorians have fallen. They do not fall. The Convention puts a bounty on your head. In late September a former friend turns you in for the reward. You are guillotined in October 1794, the last act of the Terror you began.',
      ending: 'fugitive caught (alt history)',
      historicalNote:
        'This branch is counterfactual but plausibly grounded. The Thermidorians knew that a Robespierre on the run would be a permanent threat, and the bounty would have been enormous. Outside Paris, the Republic of Virtue had little popular base; the provinces were sick of the Terror. Hiding might have bought weeks but not survival. The closest real-world parallel is Saint-Just\'s ally Lebas, who shot himself rather than be taken at the Hotel de Ville.',
    },

    altInsurrectionWin: {
      scenario:
        'You sign the call to insurrection at midnight. Hanriot\'s cannons roll into the Place du Carrousel. The rain holds off. The Faubourg Saint-Antoine answers the tocsin. By dawn on 10 Thermidor, the Convention\'s loyal sections have been driven from the Tuileries, and Tallien is dead in the street fighting. The Commune declares the Convention dissolved. Saint-Just drafts a new constitution within a week. The Reign of Terror does not end. It deepens. Eight months later the army of the Rhine, loyal to Carnot rather than to you, marches on Paris.',
      ending: 'insurrection wins, briefly (alt history)',
      historicalNote:
        'This branch is the most generous to Robespierre and is still bleak. In real history, the rain, Hanriot\'s drunkenness, the unpaid sans-culottes drifting home, and Robespierre\'s own hesitation about leading an armed assault on the Convention together caused the rising to fail. Even if it had succeeded, the army was no longer Jacobin. Carnot, the "Organizer of Victory," was already turning against the Committee. A street victory in Paris would have bought Robespierre months, not years. The Republic was running out of trust in him.',
    },
  },
};

export default robespierreTree;
